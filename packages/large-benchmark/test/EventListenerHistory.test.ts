import { afterAll, beforeEach, expect, jest, test } from '@jest/globals'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as io from '../src/parts/Io/Io.ts'
import * as prepare from '../src/parts/Prepare/Prepare.ts'

const root = await mkdtemp(join(tmpdir(), 'listener-history-'))
const command = jest.fn<typeof io.command>()
jest.unstable_mockModule('../src/parts/Io/Io.ts', () => ({ ...io, command }))
jest.unstable_mockModule('../src/parts/Prepare/Prepare.ts', () => ({ ...prepare, repositoryRoot: root }))
const { functionCountFrame, historicalCoreTests, historyMeasure, measureFunctionCounts, reportFunctionCountHistory } =
  await import('../src/parts/FunctionCountHistory/FunctionCountHistory.ts')
const commit = 'a'.repeat(40)
const raw = join(root, '.vscode-memory-leak-finder-results/event-listener-count')

beforeEach(() => {
  command.mockReset()
})
afterAll(async () => {
  await rm(root, { recursive: true, force: true })
})

test('listener collection clears only its own stale data and uses the official version when no executable is supplied', async () => {
  await io.writeJson(join(raw, 'stale.json'), { eventListenerCount: { after: 999 } })
  const functions = join(root, '.vscode-memory-leak-finder-results/function-count/base.json')
  await io.writeJson(functions, { functionCount: { after: 123 } })
  command.mockImplementation(async (_executable, args) => {
    expect(args).toEqual(expect.arrayContaining(['--vscode-version', '1.50.0', '--measure', 'event-listener-count', '--measure-after']))
    expect(args).not.toContain('--vscode-path')
    await expect(readFile(join(raw, 'stale.json'))).rejects.toThrow()
    await io.writeJson(join(raw, 'base.json'), { eventListenerCount: { after: 0 } })
    return ''
  })
  const output = join(root, 'measured')
  await measureFunctionCounts(commit, '1.50.0', '', output, 'event-listener-count', 'historical-core')
  expect(JSON.parse(await readFile(join(output, 'event-listener-count-history.json'), 'utf8'))).toMatchObject({
    commit,
    measure: 'event-listener-count',
    suite: 'historical-core',
    counts: [{ name: 'base.json', count: 0 }],
  })
  expect(await readFile(functions, 'utf8')).toContain('123')
  for (const name of historicalCoreTests)
    expect(await readFile(join(output, 'suite/src', `${name}.ts`), 'utf8')).toContain(`/packages/e2e/src/${name}.ts`)
})

test('a failed listener suite retains raw evidence and its diagnostic but still fails the measurement', async () => {
  command.mockImplementation(async () => {
    await io.writeJson(join(raw, 'base.json'), { eventListenerCount: { after: 17 } })
    throw new Error('scenario failed')
  })
  const output = join(root, 'failed')
  await expect(measureFunctionCounts(commit, '1.50.0', '/code', output, 'event-listener-count')).rejects.toThrow('scenario failed')
  expect(JSON.parse(await readFile(join(output, 'event-listener-count-history.json'), 'utf8'))).toMatchObject({
    diagnostic: 'scenario failed',
  })
  expect(JSON.parse(await readFile(join(output, 'raw/base.json'), 'utf8'))).toEqual({ eventListenerCount: { after: 17 } })
})

test('listener reports use listener results, shared scales, the initial reference, and a listener-specific video filename', async () => {
  command.mockImplementation(async (executable, args) => {
    if (executable === 'ffmpeg' && args.includes('-frames:v')) {
      const { writeFile } = await import('node:fs/promises')
      await writeFile(args.at(-1)!, 'png')
    }
    return ''
  })
  const input = join(root, 'report-input')
  const counts = [{ name: 'base.json', count: 10 }]
  await io.writeJson(join(input, 'first/event-listener-count-history.json'), { commit, counts })
  await io.writeJson(join(input, 'last/event-listener-count-history.json'), {
    commit: 'b'.repeat(40),
    counts: [{ name: 'base.json', count: 20 }],
  })
  await io.writeJson(join(input, 'function-count-history.json'), { commit, counts: [{ name: 'different.json', count: 999 }] })
  const output = join(root, 'report')
  await reportFunctionCountHistory(
    {
      schemaVersion: 1,
      measure: 'event-listener-count-history',
      frameDurationMs: 400,
      releases: [
        { version: '1.50.0', commit },
        { version: '1.145.0', commit: 'b'.repeat(40) },
      ],
    },
    input,
    output,
  )
  const html = await readFile(join(output, 'index.html'), 'utf8')
  expect(html).toContain('Event Listener Count over time')
  expect(html).toContain('2/2 versions')
  expect(html).toContain('src="event-listener-count-history.mp4"')
  const svg = await readFile(join(output, 'comparison.svg'), 'utf8')
  expect(svg).toContain('Event Listener Count')
  expect(svg).toContain('Original: VS Code 1.50.0')
  expect(svg).toContain('Current: VS Code 1.145.0')
  expect(command.mock.calls.at(-1)![1].at(-1)).toBe(join(output, 'event-listener-count-history.mp4'))
})

test('listener frames have an accurate title and unsupported count collectors are rejected', () => {
  expect(functionCountFrame('1.50.0', [{ name: 'base.json', count: 0 }], 10, undefined, 'event-listener-count')).toContain(
    'Event Listener Count',
  )
  expect(() => historyMeasure('event-listeners')).toThrow('History measure')
})
