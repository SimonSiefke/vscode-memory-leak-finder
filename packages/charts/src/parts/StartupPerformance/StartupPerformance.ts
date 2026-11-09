import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { aggregate, median, profileCosts, sampleDurations, stackLabel, type Profile } from './Aggregate.ts'
import { escapeHtml } from '../EscapeHtml/EscapeHtml.ts'
import { getCpuProfileFrames } from '../GetCpuProfileData/GetCpuProfileData.ts'
import { launchChartWorker } from '../LaunchChartWorker/LaunchChartWorker.ts'
import * as Root from '../Root/Root.ts'

const processes = ['renderer', 'main', 'shared-process', 'extension-host'] as const
interface Manifest {
  samples: number
  generatedAt: string
  environment: unknown
  version: string
  workload: string
  cachePolicy: string
  boundary: string
  overhead: string
  runs: { run: number; error?: string; profiles: Record<string, { file?: string; error?: string; attachedMs?: number }> }[]
}
const labels = {
  renderer: 'Renderer process',
  main: 'Main process',
  'shared-process': 'Shared process',
  'extension-host': 'Extension host',
}
const leafLabel = (key: string): string => {
  const frames = JSON.parse(key) as string[]
  const [name, url, line, column] = JSON.parse(frames.at(-1)!)
  return `${name || '(anonymous)'}${url ? ` (${url.split('/').at(-1)}:${line + 1}:${column + 1})` : ''}`
}
const number = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 3 })

export const generateStartupPerformance = async (
  results = join(Root.root, '.vscode-memory-leak-finder-results', 'startup-performance'),
  output = join(Root.root, '.vscode-charts', 'startup-performance'),
): Promise<void> => {
  let manifest: Manifest | undefined
  try {
    manifest = JSON.parse(await readFile(join(results, 'manifest.json'), 'utf8'))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  await mkdir(output, { recursive: true })
  const sections: string[] = []
  if (manifest) {
    await copyFile(join(results, 'manifest.json'), join(output, 'manifest.json'))
    await using rpc = await launchChartWorker()
    for (const name of processes) {
      const captures: { run: number; profile: Profile; duration: number; attachedMs?: number }[] = []
      const failures: string[] = []
      const links: string[] = []
      for (const run of manifest.runs) {
        const capture = run.profiles[name]
        if (!capture?.file || capture.error || run.error) {
          failures.push(`Run ${run.run}: ${run.error || capture?.error || 'Profile not captured'}`)
          continue
        }
        // Only collector-owned relative profile paths can be copied into the published site.
        const expected = `run-${run.run}/${name}.cpuprofile`
        if (capture.file !== expected) throw new Error(`Unexpected startup profile path: ${capture.file}`)
        try {
          const profile = JSON.parse(await readFile(join(results, expected), 'utf8')) as Profile
          profileCosts(profile)
          captures.push({
            run: run.run,
            profile,
            duration: sampleDurations(profile).reduce((sum, value) => sum + value, 0) / 1000,
            ...(capture.attachedMs === undefined ? {} : { attachedMs: capture.attachedMs }),
          })
          await mkdir(join(output, `run-${run.run}`), { recursive: true })
          await copyFile(join(results, expected), join(output, expected))
          links.push(`<a href="./${expected}" download>Run ${run.run}</a>`)
        } catch (error) {
          failures.push(`Run ${run.run}: ${String(error)}`)
        }
      }
      const rows = aggregate(captures.map((capture) => capture.profile))
      const csv =
        'stack,mean self ms,median self ms\n' +
        rows.map((row) => `"${stackLabel(row.stack).replaceAll('"', '""')}",${row.meanMs},${row.medianMs}`).join('\n')
      await writeFile(join(output, `${name}-stacks.csv`), csv)
      let chart = '<p>No valid CPU profile captures are available for this process.</p>'
      if (captures.length) {
        const middle = median(captures.map((capture) => capture.duration))
        const representative = captures.toSorted(
          (a, b) => Math.abs(a.duration - middle) - Math.abs(b.duration - middle) || a.run - b.run,
        )[0]
        const svg = await rpc.invoke(
          'Chart.create',
          getCpuProfileFrames({ ...representative.profile, timeDeltas: sampleDurations(representative.profile) }),
          {
            type: 'cpu-profile-flame-chart',
            width: 1400,
            rowHeight: 18,
            headerHeight: 72,
          },
        )
        await writeFile(join(output, `${name}.svg`), svg)
        chart = `<h3>Representative timeline · run ${representative.run}</h3>
<p>Closest sampling-window duration to the median (${number(representative.duration)} ms). This is a single run, not an averaged timeline. Profiler attached ${representative.attachedMs === undefined ? 'at an unknown time' : `${number(representative.attachedMs)} ms after launch`}.</p>
<div class="ProfileScroll" tabindex="0" role="region" aria-label="${labels[name]} flame chart"><img loading="lazy" decoding="async" src="./${name}.svg" alt="${labels[name]} CPU flame chart for run ${representative.run}"></div>`
      }
      const tableRows = rows
        .slice(0, 30)
        .map(
          (row) =>
            `<tr><td><details><summary>${escapeHtml(leafLabel(row.stack))}</summary>${escapeHtml(stackLabel(row.stack))}</details></td><td>${number(row.meanMs)}</td><td>${number(row.medianMs)}</td></tr>`,
        )
        .join('')
      sections.push(`<section id="${name}"><h2>${labels[name]}</h2>
<p>${captures.length} of ${manifest.samples} requested captures available. ${Math.max(0, manifest.samples - manifest.runs.length)} launches not recorded.</p>
${failures.length ? `<details><summary>${failures.length} failed or missing captures</summary><ul>${failures.map((failure) => `<li>${escapeHtml(failure)}</li>`).join('')}</ul></details>` : ''}
${captures.some((capture) => capture.profile.timeDeltas.some((delta) => delta < 0)) ? '<p>Some sample timestamps moved backwards. Their intervals were made monotonic for statistics and charts; raw profiles retain the original timestamps.</p>' : ''}
${chart}
${
  rows.length
    ? `<h3>Sampled self time by call stack</h3><p>Top ${Math.min(30, rows.length)} of ${rows.length} stacks, ranked by mean. <a href="./${name}-stacks.csv" download>Download all stack statistics (CSV)</a>.</p>
<table><thead><tr><th scope="col">Call stack</th><th scope="col">Mean self (ms)</th><th scope="col">Median self (ms)</th></tr></thead><tbody>${tableRows}</tbody></table>`
    : ''
}
<p>Raw CPU profiles: ${links.join(' · ') || 'Unavailable'}</p></section>`)
    }
  } else {
    for (const name of processes)
      sections.push(
        `<section id="${name}"><h2>${labels[name]}</h2><p>No startup profiles have been collected. Run the startup collector and regenerate this report.</p></section>`,
      )
  }
  const metadata = manifest
    ? `<p>Collected ${escapeHtml(manifest.generatedAt)} · ${manifest.samples} requested launches. <a href="./manifest.json" download>Download capture manifest</a>.</p>
<details><summary>Measurement method and environment</summary><dl>${[
        ['Workload', manifest.workload],
        ['Cache policy', manifest.cachePolicy],
        ['Capture boundary', manifest.boundary],
        ['Profiling overhead', manifest.overhead],
        ['Environment', JSON.stringify(manifest.environment)],
        ['VS Code version', manifest.version],
      ]
        .map(([label, value]) => `<dt>${label}</dt><dd>${escapeHtml(value || 'Not recorded')}</dd>`)
        .join('')}</dl></details>`
    : '<p>Startup measurements are not available yet.</p>'
  await writeFile(
    join(output, 'index.html'),
    `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>VS Code startup performance</title>
<style>
main{max-width:1500px;margin:auto;padding:24px}h1{font-size:28px}h2{margin-top:48px}h3{margin-top:28px}p,dl{max-width:80ch}dt{font-weight:600;margin-top:12px}dd{margin:4px 0;overflow-wrap:anywhere}summary{cursor:pointer}main>details{margin:16px 0}section{border-top:1px solid #d1d9e0;margin-top:36px}.ProfileScroll{overflow:auto;max-height:600px;border:1px solid #d1d9e0}.ProfileScroll img{display:block;min-width:1400px}table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}th,td{padding:10px;border-bottom:1px solid #d1d9e0;text-align:right;vertical-align:top}th:first-child,td:first-child{text-align:left;min-width:240px;overflow-wrap:anywhere}th:not(:first-child){min-width:110px}nav ul{display:flex;flex-wrap:wrap;gap:12px 24px;padding-left:20px}@media(max-width:600px){main{padding:16px}.ProfileScroll{max-height:400px}h1{font-size:24px}}
</style></head><body><main><h1>VS Code startup performance</h1>
<p>CPU profiles across repeated launches, with separate results for each process.</p>
<nav aria-label="Startup processes"><ul>${processes.map((name) => `<li><a href="#${name}">${labels[name]}</a></li>`).join('')}</ul></nav>
${metadata}
<details><summary>How to read these profiles</summary><p>Aggregation uses the complete call stack (function name, URL, line and column), ignoring run-local node and script IDs. Mean and median are computed across valid captures only. An unsampled stack in a valid capture contributes zero; a missing capture is excluded. These are sampled self times, including idle samples, not wall-clock startup timings. Timelines retain their original chronology.</p></details>
${sections.join('\n')}</main></body></html>`,
  )
}
