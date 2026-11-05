import { afterAll, beforeEach, expect, jest, test } from '@jest/globals'
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as io from '../src/parts/Io/Io.ts'
import * as prepare from '../src/parts/Prepare/Prepare.ts'

const root = await mkdtemp(join(tmpdir(), 'count-history-batch-'))
const command = jest.fn<typeof io.command>()
jest.unstable_mockModule('../src/parts/Io/Io.ts', () => ({ ...io, command }))
jest.unstable_mockModule('../src/parts/Prepare/Prepare.ts', () => ({ ...prepare, repositoryRoot: root }))
const { measureHistories, reportHistories } = await import('../src/parts/CountHistoryBatch/CountHistoryBatch.ts')
const { largePerformance } = await import('../src/parts/Main/Main.ts')
const commit = 'a'.repeat(40)
const profile = join(root, '.vscode-user-data-dir')
beforeEach(() => {
  command.mockReset()
})
afterAll(async () => {
  await rm(root, { recursive: true, force: true })
})

test('a batch runs collectors serially, isolates profiles, restores the previous profile, and continues after a failure', async () => {
  await mkdir(profile, { recursive: true })
  await writeFile(join(profile, 'original'), 'preserved')
  const order: string[] = []
  command.mockImplementation(async (_executable, args) => {
    const measure = args[args.indexOf('--measure') + 1]!
    order.push(measure)
    await expect(readFile(join(profile, 'original'))).rejects.toThrow()
    await expect(readFile(join(profile, 'dirty'))).rejects.toThrow()
    await mkdir(profile)
    await writeFile(join(profile, 'dirty'), measure)
    if (measure === 'object-count') throw new Error('unsupported old collector')
    const key = measure === 'function-count' ? 'functionCount' : 'stringObjectBytes'
    await io.writeJson(join(root, '.vscode-memory-leak-finder-results', measure, 'base.json'), {
      [key]: { after: measure === 'function-count' ? 10 : 2048 },
    })
    return ''
  })
  const output = join(root, 'measured')
  await expect(
    measureHistories(commit, '1.50.0', '', output, ['function-count', 'object-count', 'string-object-bytes'], 'default'),
  ).rejects.toThrow('Some history collectors failed')
  expect(order).toEqual(['function-count', 'object-count', 'string-object-bytes'])
  expect(await readFile(join(profile, 'original'), 'utf8')).toBe('preserved')
  await expect(readFile(join(profile, 'dirty'))).rejects.toThrow()
  expect((await readdir(root)).filter((name) => name.startsWith('.large-history-profile-'))).toEqual([])
  const statuses = JSON.parse(await readFile(join(output, 'measurement-status.json'), 'utf8'))
  expect(statuses[1].diagnostic).toContain('unsupported old collector')
  const bytes = JSON.parse(await readFile(join(output, 'string-object-bytes/string-object-bytes-history.json'), 'utf8'))
  expect(bytes).toMatchObject({ measure: 'string-object-bytes', unit: 'bytes', counts: [{ name: 'base.json', count: 2048 }] })
})

test('a batch removes its temporary profile when no profile existed before measurement', async () => {
  await rm(profile, { recursive: true, force: true })
  command.mockImplementation(async (_executable, args) => {
    const measure = args[args.indexOf('--measure') + 1]!
    await expect(readFile(join(profile, 'dirty'))).rejects.toThrow()
    await mkdir(profile)
    await writeFile(join(profile, 'dirty'), measure)
    throw new Error('collector failed after profile creation')
  })
  await expect(
    measureHistories(commit, '1.50.0', '', join(root, 'no-original-profile'), ['function-count', 'object-count'], 'default'),
  ).rejects.toThrow('Some history collectors failed')
  expect(command).toHaveBeenCalledTimes(2)
  await expect(readdir(profile)).rejects.toThrow()
  expect((await readdir(root)).filter((name) => name.startsWith('.large-history-profile-'))).toEqual([])
})

test('a batch report keeps successful videos when another metric has no usable frames', async () => {
  command.mockImplementation(async (_executable, args) => {
    await writeFile(args.at(-1)!, 'rendered')
    return ''
  })
  const input = join(root, 'report-input')
  for (const [measure, count] of [
    ['function-count', 10],
    ['string-object-bytes', 2048],
  ] as const)
    await io.writeJson(join(input, `${measure}-history.json`), { commit, measure, counts: [{ name: 'base.json', count }] })
  const output = join(root, 'report')
  await expect(
    reportHistories(
      {
        schemaVersion: 2,
        measures: ['function-count', 'object-count', 'string-object-bytes'],
        releases: [{ version: '1.50.0', commit }],
        frameDurationMs: 400,
      },
      input,
      output,
    ),
  ).rejects.toThrow('Some history videos are unavailable')
  const videos = JSON.parse(await readFile(join(output, 'videos.json'), 'utf8'))
  expect(videos[0]).toMatchObject({ measure: 'function-count', video: 'function-count/function-count-history.mp4' })
  expect(videos[1].diagnostic).toContain('no usable')
  expect(videos[2]).toMatchObject({
    measure: 'string-object-bytes',
    unit: 'bytes',
    video: 'string-object-bytes/string-object-bytes-history.mp4',
  })
  expect(await readFile(join(output, videos[0].video), 'utf8')).toBe('rendered')
  expect(await readFile(join(output, videos[2].video), 'utf8')).toBe('rendered')
  expect(await readFile(join(output, 'index.html'), 'utf8')).toContain('string-object-bytes/string-object-bytes-history.mp4')
  expect(await readFile(join(output, 'string-object-bytes/index.html'), 'utf8')).toContain('Unit: bytes')
})

test('multi-measure matrices freeze one release matrix and the requested collector list', async () => {
  const fetch = jest.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    const path = new URL(String(url)).pathname
    if (path === '/api/releases/stable') return Response.json(['1.50.0', '1.50.1'])
    const version = path.split('/')[3]!
    return Response.json({ productVersion: version, version: (version === '1.50.0' ? 'a' : 'b').repeat(40) })
  })
  const log = jest.spyOn(console, 'log').mockImplementation(() => {})
  try {
    const output = join(root, 'matrix')
    await largePerformance([
      'history-matrix',
      '--version-range',
      '1.50.0...1.50.1',
      '--measure',
      'object-count,string-object-bytes',
      '--output-dir',
      output,
    ])
    const manifest = JSON.parse(await readFile(join(output, 'manifest.json'), 'utf8'))
    expect(manifest).toMatchObject({ schemaVersion: 2, measures: ['object-count', 'string-object-bytes'] })
    expect(manifest.releases).toHaveLength(2)
    expect(JSON.parse(log.mock.calls[0]![0] as string).include).toHaveLength(2)
  } finally {
    fetch.mockRestore()
    log.mockRestore()
  }
})
