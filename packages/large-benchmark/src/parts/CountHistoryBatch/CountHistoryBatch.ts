import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { measureCounts, reportCountHistory, type HistoryManifest, type HistorySuite } from '../CountHistory/CountHistory.ts'
import { historyMeasures, historyMeasureDefinition, type HistoryMeasure } from '../CountHistoryMeasures/CountHistoryMeasures.ts'
import { errorMessage, writeJson } from '../Io/Io.ts'
import { repositoryRoot } from '../Prepare/Prepare.ts'
import type { StableRelease } from '../VersionRange/VersionRange.ts'

export interface BatchHistoryManifest {
  schemaVersion: 2
  measures: HistoryMeasure[]
  releases: StableRelease[]
  frameDurationMs: number
  suite?: HistorySuite
}
export type CountHistoryManifest = HistoryManifest | BatchHistoryManifest

export const measureHistories = async (
  commit: string,
  version: string,
  executable: string,
  output: string,
  measures: HistoryMeasure[],
  suite: HistorySuite,
): Promise<void> => {
  const selected = historyMeasures(measures.join(','))
  if (selected.length === 1) return measureCounts(commit, version, executable, output, selected[0]!, suite)
  // Each collector gets a fresh process and profile. Restore the checkout's
  // previous profile afterwards; never let one pass prime the next metric.
  const profile = join(repositoryRoot, '.vscode-user-data-dir')
  const backup = await mkdtemp(join(repositoryRoot, '.large-history-profile-'))
  let restore = false
  const statuses: { measure: HistoryMeasure; diagnostic?: string }[] = []
  try {
    try {
      await rename(profile, join(backup, 'profile'))
      restore = true
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
    for (const measure of selected) {
      try {
        await rm(profile, { recursive: true, force: true })
        await measureCounts(commit, version, executable, join(output, measure), measure, suite)
        statuses.push({ measure })
      } catch (error) {
        statuses.push({ measure, diagnostic: errorMessage(error) })
      }
      await writeJson(join(output, 'measurement-status.json'), statuses)
    }
  } finally {
    if (restore) {
      await rm(profile, { recursive: true, force: true })
      await rename(join(backup, 'profile'), profile)
    }
    await rm(backup, { recursive: true, force: true })
  }
  if (statuses.some((item) => item.diagnostic))
    throw new Error('Some history collectors failed; per-measure evidence and diagnostics preserved')
}

export const reportHistories = async (manifest: CountHistoryManifest, input: string, output: string): Promise<void> => {
  if (manifest.schemaVersion === 1) return reportCountHistory(manifest, input, output)
  if (manifest.schemaVersion !== 2 || !Array.isArray(manifest.measures) || !manifest.measures.length)
    throw new Error('Invalid multi-measure history manifest')
  const measures = historyMeasures(manifest.measures.join(','))
  const videos: { measure: HistoryMeasure; unit: string; report: string; video?: string; diagnostic?: string }[] = []
  await mkdir(output, { recursive: true })
  for (const measure of measures) {
    const item = { measure, unit: historyMeasureDefinition(measure).unit, report: `${measure}/index.html` }
    try {
      await reportCountHistory(
        {
          schemaVersion: 1,
          measure: `${measure}-history`,
          releases: manifest.releases,
          frameDurationMs: manifest.frameDurationMs,
          ...(manifest.suite ? { suite: manifest.suite } : {}),
        },
        input,
        join(output, measure),
      )
      videos.push({ ...item, video: `${measure}/${measure}-history.mp4` })
    } catch (error) {
      videos.push({ ...item, diagnostic: errorMessage(error) })
    }
  }
  await writeJson(join(output, 'videos.json'), videos)
  await writeFile(
    join(output, 'index.html'),
    `<!doctype html><meta charset="utf-8"><title>Renderer metrics over time</title>
<h1>Renderer metrics over time</h1><p>Each metric has its own video, fixed scale, first-version reference, and coverage diagnostics. <a href="videos.json">Video status</a></p>
<ul>${videos.map((item) => `<li><a href="${item.report}">${historyMeasureDefinition(item.measure).title}</a> (${item.unit}) — ${item.video ? `<a href="${item.video}">MP4 video</a>` : 'unavailable; see video status and coverage'}</li>`).join('')}</ul>`,
  )
  if (videos.some((item) => item.diagnostic))
    throw new Error('Some history videos are unavailable; successful videos and diagnostics preserved')
}
