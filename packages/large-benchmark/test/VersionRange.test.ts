import { afterEach, expect, jest, test } from '@jest/globals'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeJson } from '../src/parts/Io/Io.ts'
import { largePerformance } from '../src/parts/Main/Main.ts'
import { type SeriesManifest } from '../src/parts/Series/Series.ts'
import { parseVersionRange, resolveVersionRange } from '../src/parts/VersionRange/VersionRange.ts'

const directories: string[] = []
afterEach(async () => {
  jest.restoreAllMocks()
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

const mockReleases = (versions: string[]) => {
  const commits = new Map(versions.map((version, index) => [version, (index + 1).toString(16).padStart(40, '0')]))
  const fetch = jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = new URL(String(input))
    expect(url.origin).toBe('https://update.code.visualstudio.com')
    expect(url.searchParams.get('released')).toBe('true')
    if (url.pathname === '/api/releases/stable') return Response.json(versions)
    const version = url.pathname.match(/^\/api\/versions\/([^/]+)\/linux-x64\/stable$/)?.[1]
    if (!version || !commits.has(version)) throw new Error(`Unexpected version request: ${url}`)
    return Response.json({ version: commits.get(version), productVersion: version })
  })
  return { fetch, commits }
}

test('ranges require full stable version numbers and ascending endpoints', () => {
  expect(parseVersionRange(' 1.120.0 ... 1.130.0 ')).toEqual({ from: '1.120.0', to: '1.130.0' })
  for (const range of [
    '',
    '1.120...1.130',
    '1.120.0..1.130.0',
    '1.130.0...1.120.0',
    '1.120.0-insider...1.130.0',
    '01.120.0...1.130.0',
    '1.120.0...1.130.0...1.140.0',
    '1.9007199254740992.0...2.0.0',
  ])
    expect(() => parseVersionRange(range)).toThrow()
})

test('resolution includes both endpoints and intervening patches in numeric version order, excluding prereleases', async () => {
  const { fetch, commits } = mockReleases(['1.10.1', '1.10.0', '1.9.3-insider', '1.9.3', '1.9.2', '1.9.1', '1.8.0'])
  expect(await resolveVersionRange('1.9.1...1.10.0')).toEqual(
    ['1.9.1', '1.9.2', '1.9.3', '1.10.0'].map((version) => ({ version, commit: commits.get(version) })),
  )
  expect(fetch).toHaveBeenCalledTimes(5)
})

test('ranges reject unknown or unpublished endpoints without attempting commit resolution', async () => {
  const { fetch } = mockReleases(['1.120.0', '1.121.0'])
  await expect(resolveVersionRange('1.120.0...1.130.0')).rejects.toThrow('1.130.0 is not a published stable release')
  expect(fetch).toHaveBeenCalledTimes(1)
})

test.each([1, 257])('ranges reject %s selected releases before requesting commit metadata', async (count) => {
  const versions = Array.from({ length: count }, (_, index) => `1.${index}.0`)
  const { fetch } = mockReleases(versions)
  await expect(resolveVersionRange(`${versions[0]}...${versions.at(-1)}`)).rejects.toThrow('between 2 and 256')
  expect(fetch).toHaveBeenCalledTimes(1)
})

test.each([null, {}, ['1.120.0', 123]])('malformed release lists are rejected (%j)', async (body) => {
  jest.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(body))
  await expect(resolveVersionRange('1.120.0...1.130.0')).rejects.toThrow('Invalid stable VS Code release list')
})

test.each([
  { version: 'not-a-hash', productVersion: '1.120.0' },
  { version: 'a'.repeat(40), productVersion: '1.120.1' },
  { version: 'a'.repeat(40) },
  null,
])('invalid or mismatched release metadata fails instead of substituting another commit (%j)', async (metadata) => {
  jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(Response.json(['1.120.0', '1.121.0']))
    .mockImplementation(async () => Response.json(metadata))
  await expect(resolveVersionRange('1.120.0...1.121.0')).rejects.toThrow('Invalid stable Linux x64 release metadata')
})

test('HTTP errors and broken JSON surface as resolution failures', async () => {
  const fetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('unavailable', { status: 503 }))
  await expect(resolveVersionRange('1.120.0...1.130.0')).rejects.toThrow('HTTP 503')
  fetch.mockResolvedValue(new Response('not JSON'))
  await expect(resolveVersionRange('1.120.0...1.130.0')).rejects.toThrow('Unable to resolve stable VS Code releases')
})

test('a missing Linux build fails the range instead of skipping the version', async () => {
  jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(Response.json(['1.120.0', '1.121.0']))
    .mockImplementation(async () => new Response('', { status: 404 }))
  await expect(resolveVersionRange('1.120.0...1.121.0')).rejects.toThrow('HTTP 404')
})

test.each([
  ['--commits', JSON.stringify(['a'.repeat(40), 'b'.repeat(40)])],
  ['--before-commit', 'a'.repeat(40)],
  ['--after-commit', 'b'.repeat(40)],
])('version ranges cannot be combined with other revision inputs (%s)', async (...args) => {
  const fetch = jest.spyOn(globalThis, 'fetch')
  await expect(largePerformance(['matrix', '--version-range', '1.120.0...1.130.0', ...args])).rejects.toThrow('cannot be combined')
  expect(fetch).not.toHaveBeenCalled()
})

test('range CLI freezes version-to-commit resolution in the manifest and displays version labels in reports', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'performance-version-range-test-'))
  directories.push(directory)
  const versions = ['1.130.0', '1.121.1', '1.120.0']
  const { commits } = mockReleases(versions)
  const output = join(directory, 'manifest')
  jest.spyOn(console, 'log').mockImplementation(() => {})
  await largePerformance(['matrix', '--version-range', '1.120.0...1.130.0', '--measures', 'startup-times', '--output-dir', output])
  const manifestPath = join(output, 'manifest.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as SeriesManifest
  const ordered = [...versions].reverse()
  expect(manifest.commits).toEqual(ordered.map((version) => commits.get(version)))
  expect(manifest.releases).toEqual(ordered.map((version) => ({ version, commit: commits.get(version) })))
  expect(manifest.benchmarks).toHaveLength(4)
  const input = join(directory, 'results')
  for (let index = 0; index < 2; index++)
    await writeJson(join(input, `pair-${index}`, 'result.json'), {
      schemaVersion: 1,
      benchmark: manifest.benchmarks[0],
      commits: { before: manifest.commits[index], after: manifest.commits[index + 1] },
      requestedSamples: 1,
      status: 'success',
      runner: {},
      diagnostics: [],
      samples: (['before', 'after'] as const).map((revision, order) => ({
        pair: 0,
        revision,
        order,
        status: 'success',
        metrics: [{ name: 'startupTime', unit: 'ms', coverage: 'workbench', value: order ? 110 : 100 }],
        diagnostics: [],
        raw: [],
        elapsedMs: 1,
      })),
    })
  const report = join(directory, 'report')
  const fetch = jest.spyOn(globalThis, 'fetch').mockClear().mockRejectedValue(new Error('Reports must use the frozen manifest'))
  await largePerformance(['report', '--manifest', manifestPath, '--input-dir', input, '--output-dir', report])
  const html = await readFile(join(report, 'index.html'), 'utf8')
  expect(html).toContain('1.120.0 → 1.121.1')
  expect(html).toContain('1.121.1 → 1.130.0')
  const chart = await readFile(join(report, 'charts', 'trend-1.svg'), 'utf8')
  expect(chart).toContain('1.121.1')
  expect(chart).toContain(commits.get('1.121.1')!)
  // Resolution happens only during matrix generation.
  expect(fetch).not.toHaveBeenCalled()
})
