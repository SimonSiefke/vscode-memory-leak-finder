import { afterEach, expect, jest, test } from '@jest/globals'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { functionCountFrame, reportFunctionCountHistory } from '../src/parts/FunctionCountHistory/FunctionCountHistory.ts'
import { writeJson } from '../src/parts/Io/Io.ts'
import { largePerformance } from '../src/parts/Main/Main.ts'
import { resolveLastVersions } from '../src/parts/VersionRange/VersionRange.ts'

const directories: string[] = []
afterEach(async () => {
  jest.restoreAllMocks()
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})
const temporary = async () => {
  const path = await mkdtemp(join(tmpdir(), 'function-history-'))
  directories.push(path)
  return path
}

test('frames preserve zero counts, fixed axes, and place escaped version labels at the top right', () => {
  const frame = functionCountFrame(
    '1.100.0<&',
    [
      { name: 'a.json', count: 0 },
      { name: 'b.json', count: 100 },
    ],
    200,
  )
  expect(frame).toContain('points="100,620 1180,370"')
  expect(frame).toContain('x="1180" y="55" text-anchor="end"')
  expect(frame).toContain('VS Code 1.100.0&lt;&amp;')
  expect(frame).toContain('200')
})

test('latest releases use numeric ordering, include patches, and resolve oldest first', async () => {
  jest.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    const path = new URL(String(url)).pathname
    if (path === '/api/releases/stable') return Response.json(['1.9.0', '1.10.1', '1.10.0', '1.11.0-insider', '1.10.1'])
    const version = path.split('/')[3]!
    return Response.json({ productVersion: version, version: (version === '1.10.0' ? 'a' : 'b').repeat(40) })
  })
  expect((await resolveLastVersions(2)).map((release) => release.version)).toEqual(['1.10.0', '1.10.1'])
  await expect(resolveLastVersions(1)).rejects.toThrow('--last-versions')
})

test('missing and duplicate results preserve a coverage report and fail without a fabricated video', async () => {
  const directory = await temporary()
  const result = { commit: 'a'.repeat(40), counts: [{ name: 'a.json', count: 1 }] }
  await writeJson(join(directory, 'input/first/function-count-history.json'), result)
  await writeJson(join(directory, 'input/duplicate/function-count-history.json'), result)
  const output = join(directory, 'output')
  await expect(
    reportFunctionCountHistory(
      {
        schemaVersion: 1,
        measure: 'function-count-history',
        frameDurationMs: 400,
        releases: [
          { version: '1.100.0', commit: result.commit },
          { version: '1.101.0', commit: 'b'.repeat(40) },
        ],
      },
      join(directory, 'input'),
      output,
    ),
  ).rejects.toThrow('no usable')
  const coverage = JSON.parse(await readFile(join(output, 'coverage.json'), 'utf8'))
  expect(coverage.map((item: { included: boolean }) => item.included)).toEqual([false, false])
  expect(await readFile(join(output, 'index.html'), 'utf8')).toContain('0/2 versions')
})

test('history matrix rejects conflicting release selection and invalid frame timing before fetching', async () => {
  await expect(largePerformance(['history-matrix', '--version-range', '1.1.0...1.2.0', '--last-versions', '20'])).rejects.toThrow(
    'Use --version-range',
  )
  await expect(largePerformance(['history-matrix', '--frame-duration-ms', '0'])).rejects.toThrow('--frame-duration-ms')
})

test('failed suites with partial counts cannot define an inventory or become frames', async () => {
  const directory = await temporary()
  const commit = 'a'.repeat(40)
  await writeJson(join(directory, 'input/function-count-history.json'), {
    commit,
    counts: [{ name: 'a.json', count: 12 }],
    diagnostic: 'test suite exited 1',
  })
  await expect(
    reportFunctionCountHistory(
      { schemaVersion: 1, measure: 'function-count-history', frameDurationMs: 400, releases: [{ version: '1.100.0', commit }] },
      join(directory, 'input'),
      join(directory, 'output'),
    ),
  ).rejects.toThrow('no usable')
  expect(JSON.parse(await readFile(join(directory, 'output/test-order.json'), 'utf8'))).toEqual([])
})
