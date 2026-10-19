import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseCommitReference } from '../CommitReference/CommitReference.ts'
import { command, errorMessage, readJson, writeJson } from '../Io/Io.ts'
import { repositoryRoot } from '../Prepare/Prepare.ts'
import type { StableRelease } from '../VersionRange/VersionRange.ts'

export interface HistoryManifest {
  schemaVersion: 1
  measure: 'function-count-history'
  releases: StableRelease[]
  frameDurationMs: number
}
export interface HistoryResult {
  commit: string
  counts: { name: string; count: number }[]
  diagnostic?: string
}

// The CLI writes to a shared directory: run serially within a checkout and clear
// only this collector before launching, so stale measurements cannot become frames.
export const measureFunctionCounts = async (commit: string, version: string, executable: string, output: string): Promise<void> => {
  const reference = parseCommitReference(commit).reference
  const raw = join(repositoryRoot, '.vscode-memory-leak-finder-results/function-count')
  await rm(raw, { recursive: true, force: true })
  let diagnostic: string | undefined
  try {
    await command(
      process.execPath,
      [
        join(repositoryRoot, 'packages/cli/bin/test.js'),
        '--cwd',
        'packages/e2e',
        '--vscode-version',
        version,
        '--vscode-path',
        executable,
        '--check-leaks',
        '--measure-after',
        '--measure',
        'function-count',
      ],
      { cwd: repositoryRoot, timeout: 300 * 60_000, inherit: true },
    )
  } catch (error) {
    // Preserve partial data for diagnosis; failed suite runs cannot become frames.
    diagnostic = errorMessage(error)
  }
  await mkdir(output, { recursive: true })
  const counts: HistoryResult['counts'] = []
  for (const name of (await readdir(raw).catch(() => [] as string[])).sort()) {
    if (!name.endsWith('.json')) continue
    const data = await readJson<{ functionCount?: { after?: unknown } }>(join(raw, name))
    const count = data.functionCount?.after
    if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0) throw new Error(`Invalid function count: ${name}`)
    counts.push({ name, count })
  }
  await cp(raw, join(output, 'raw'), { recursive: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error
  })
  await writeJson(join(output, 'function-count-history.json'), { commit: reference, counts, ...(diagnostic ? { diagnostic } : {}) })
  if (diagnostic || !counts.length) throw new Error(diagnostic || 'No function counts collected')
}

const escape = (value: string): string => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')

export const functionCountFrame = (version: string, counts: HistoryResult['counts'], maximum: number): string => {
  const x = (index: number) => 100 + (index / Math.max(1, counts.length - 1)) * 1080
  const y = (count: number) => 620 - (count / maximum) * 500
  const grid = Array.from({ length: 6 }, (_, i) => {
    const count = (maximum * i) / 5
    return `<path d="M100 ${y(count)}H1180" stroke="#ddd"/><text x="90" y="${y(count) + 5}" text-anchor="end">${Math.round(count).toLocaleString('en-US')}</text>`
  }).join('')
  const ticks = counts
    .map((point, index) =>
      index % Math.max(1, Math.ceil(counts.length / 10)) === 0 ? `<text x="${x(index)}" y="650" text-anchor="middle">${index}</text>` : '',
    )
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
<rect width="1280" height="720" fill="white"/><g font-family="DejaVu Sans" font-size="16" fill="#222">
<text x="100" y="55" font-size="28">Function Count</text><text x="1180" y="55" text-anchor="end" font-size="28">VS Code ${escape(version)}</text>
${grid}${ticks}<polyline points="${counts.map((point, index) => `${x(index)},${y(point.count)}`).join(' ')}" fill="none" stroke="black" stroke-width="2"/>
<text x="640" y="695" text-anchor="middle">E2E test index (same test order for every version)</text></g></svg>`
}

const findResults = async (directory: string): Promise<HistoryResult[]> => {
  const results: HistoryResult[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) results.push(...(await findResults(path)))
    else if (entry.name === 'function-count-history.json') results.push(await readJson<HistoryResult>(path))
  }
  return results
}

export const reportFunctionCountHistory = async (manifest: HistoryManifest, input: string, output: string): Promise<void> => {
  if (
    manifest.schemaVersion !== 1 ||
    manifest.measure !== 'function-count-history' ||
    !manifest.releases?.length ||
    !Number.isSafeInteger(manifest.frameDurationMs) ||
    manifest.frameDurationMs < 40 ||
    manifest.frameDurationMs > 60_000
  )
    throw new Error('Invalid function-count history manifest')
  const results = await findResults(input)
  const ordered = manifest.releases.map((release) => {
    const matches = results.filter((result) => result.commit === release.commit)
    const result = matches.length === 1 ? matches[0] : undefined
    return { ...release, result }
  })
  // The most complete inventory defines the chart. Never shift positions when an
  // old version fails a scenario, or turn missing counts into zero.
  const inventory =
    ordered.map((item) => (item.result?.diagnostic ? [] : (item.result?.counts ?? []))).sort((a, b) => b.length - a.length)[0] ?? []
  const names = inventory.map((point) => point.name)
  const usable = (result: HistoryResult | undefined): result is HistoryResult =>
    !!result &&
    !result.diagnostic &&
    names.length > 0 &&
    result.counts.length === names.length &&
    new Set(names).size === names.length &&
    result.counts.every((point, index) => point.name === names[index] && Number.isSafeInteger(point.count) && point.count >= 0)
  const frames = ordered.filter((item) => usable(item.result))
  const maximum = Math.max(1, ...frames.flatMap((item) => item.result!.counts.map((point) => point.count))) * 1.05
  await mkdir(output, { recursive: true })
  const frameDir = join(output, 'frames')
  await rm(frameDir, { recursive: true, force: true })
  await rm(join(output, 'function-count-history.mp4'), { force: true })
  await mkdir(frameDir)
  await writeJson(
    join(output, 'coverage.json'),
    ordered.map((item) => ({
      version: item.version,
      commit: item.commit,
      included: usable(item.result),
      diagnostic: item.result?.diagnostic,
      reason: usable(item.result) ? undefined : 'Missing/duplicate result, failed suite, or incomplete/mismatched test inventory',
    })),
  )
  await writeJson(join(output, 'test-order.json'), names)
  await writeFile(
    join(output, 'index.html'),
    `<!doctype html><meta charset="utf-8"><title>Function counts over time</title>
<h1>Function counts over time</h1><p>${frames.length}/${ordered.length} versions; ${manifest.frameDurationMs} ms per frame. Shared axes. <a href="coverage.json">Coverage and diagnostics</a> · <a href="test-order.json">Test order</a></p>
<video controls loop width="1280" src="function-count-history.mp4"></video><ul>${ordered.map((item) => `<li>VS Code ${escape(item.version)}: ${usable(item.result) ? 'included' : 'unavailable'}</li>`).join('')}</ul>`,
  )
  if (!frames.length) throw new Error('Report preserved, but no usable function-count frames exist')
  for (const [index, item] of frames.entries()) {
    const path = join(frameDir, String(index).padStart(4, '0'))
    await writeFile(`${path}.svg`, functionCountFrame(item.version, item.result!.counts, maximum))
    await command('ffmpeg', ['-v', 'error', '-y', '-c:v', 'librsvg', '-i', `${path}.svg`, '-frames:v', '1', `${path}.png`])
  }
  await command('ffmpeg', [
    '-y',
    '-framerate',
    String(1000 / manifest.frameDurationMs),
    '-i',
    join(frameDir, '%04d.png'),
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-r',
    '25',
    '-t',
    String((frames.length * manifest.frameDurationMs) / 1000),
    '-movflags',
    '+faststart',
    join(output, 'function-count-history.mp4'),
  ])
}
