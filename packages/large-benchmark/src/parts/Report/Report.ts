import { reportSmoke } from '../Smoke/Smoke.ts'
import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { errorMessage, readJson } from '../Io/Io.ts'
import { selectBenchmarks } from '../Manifest/Manifest.ts'
import { selectorTableHtml } from '../CssSelectorReport/CssSelectorTable.ts'
import { selectorDetailsSvg } from '../CssSelectorReport/CssSelectorReport.ts'
import { comparePairs } from '../Statistics/Statistics.ts'
import type { Benchmark, Metric, Result, Sample, Status } from '../Types/Types.ts'

export const escapeHtml = (value: unknown): string =>
  String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
const format = (value: number): string => value.toLocaleString('en-US', { maximumFractionDigits: 3 })
const href = (path: string): string => path.split('/').map(encodeURIComponent).join('/')

export interface Comparison {
  benchmark: string
  scenario: string
  collector: string
  startup: boolean
  cache: string
  metric: string
  unit: string
  coverage: string
  higherIsBetter: boolean
  statistics: ReturnType<typeof comparePairs>
}

const validSample = (sample: Sample): boolean => sample.status === 'success' || sample.status === 'partial'

export const comparisonsFor = (result: Result): Comparison[] => {
  const metricKeys = new Map<string, Metric>()
  for (const sample of result.samples.filter(validSample))
    for (const metric of sample.metrics) metricKeys.set(`${metric.name}\0${metric.unit}\0${metric.coverage}`, metric)
  return [...metricKeys.values()].flatMap((metric) => {
    const before: number[] = []
    const after: number[] = []
    const lookup = (sample: Sample): Metric | undefined =>
      sample.metrics.find((entry) => entry.name === metric.name && entry.unit === metric.unit && entry.coverage === metric.coverage)
    for (let pair = 0; pair < result.requestedSamples; pair++) {
      const baseline = result.samples.find((sample) => sample.pair === pair && sample.revision === 'before' && validSample(sample))
      const candidate = result.samples.find((sample) => sample.pair === pair && sample.revision === 'after' && validSample(sample))
      const start = baseline && lookup(baseline)
      const end = candidate && lookup(candidate)
      if (start && end && Number.isFinite(start.value) && Number.isFinite(end.value)) {
        before.push(start.value)
        after.push(end.value)
      }
    }
    if (!before.length) return []
    const primary = metric.unit === 'ms' ? 'median' : 'mean'
    const statistics = comparePairs(before, after, primary)
    if (result.benchmark.collector === 'bundles') statistics.inconclusive = false
    return [
      {
        benchmark: result.benchmark.id,
        scenario: result.benchmark.scenario,
        collector: result.benchmark.collector,
        startup: result.benchmark.startup,
        cache: result.benchmark.cache,
        metric: metric.name,
        unit: metric.unit,
        coverage: metric.coverage,
        higherIsBetter: metric.higherIsBetter ?? false,
        statistics,
      },
    ]
  })
}

export const validateResult = (raw: unknown, expected: Benchmark, commits: { before: string; after: string }): Result => {
  const result = raw as Result
  if (
    !result ||
    result.schemaVersion !== 1 ||
    result.benchmark?.id !== expected.id ||
    result.commits?.before !== commits.before ||
    result.commits?.after !== commits.after ||
    !Array.isArray(result.samples) ||
    !Number.isSafeInteger(result.requestedSamples) ||
    result.requestedSamples < 1 ||
    result.requestedSamples > 1000 ||
    !['success', 'partial', 'failed', 'unavailable', 'missing'].includes(result.status)
  )
    throw new Error('Result identity, commits, or sample count do not match this run')
  const seen = new Set<string>()
  for (const sample of result.samples) {
    const key = `${sample.pair}:${sample.revision}`
    if (
      !['before', 'after'].includes(sample.revision) ||
      !Number.isSafeInteger(sample.pair) ||
      sample.pair < 0 ||
      sample.pair >= result.requestedSamples ||
      seen.has(key) ||
      !['success', 'partial', 'failed', 'unavailable', 'missing'].includes(sample.status) ||
      !Array.isArray(sample.metrics) ||
      !Array.isArray(sample.diagnostics) ||
      !Array.isArray(sample.raw)
    )
      throw new Error('Invalid or duplicate sample')
    seen.add(key)
    for (const metric of sample.metrics)
      if (
        typeof metric.name !== 'string' ||
        typeof metric.unit !== 'string' ||
        typeof metric.coverage !== 'string' ||
        !Number.isFinite(metric.value)
      )
        throw new Error('Invalid metric')
    if (
      sample.selectorStats !== undefined &&
      (!Array.isArray(sample.selectorStats) ||
        sample.selectorStats.some(
          (row) =>
            !row ||
            typeof row.selector !== 'string' ||
            ['elapsedMs', 'matchAttempts', 'matchCount', 'invalidationCount'].some(
              (field) => !Number.isFinite(row[field as keyof typeof row]) || (row[field as keyof typeof row] as number) < 0,
            ),
        ))
    )
      throw new Error('Invalid CSS selector statistics')
    if (sample.raw.some((path) => typeof path !== 'string' || path.startsWith('/') || path.split(/[\\/]/).includes('..')))
      throw new Error('Invalid raw result reference')
  }
  // Use the manifest as the source of truth for collector/cache/scenario identity.
  return { ...result, benchmark: expected, diagnostics: Array.isArray(result.diagnostics) ? result.diagnostics : [] }
}

export const comparisonSvg = (comparison: Comparison): string => {
  const { statistics: s } = comparison
  const all = [...s.beforeSamples, ...s.afterSamples, 0]
  const min = Math.min(...all)
  const max = Math.max(...all)
  const scale = (value: number): number => 180 + ((value - min) / (max - min || 1)) * 610
  const baseline = s.before[s.primary]
  const candidate = s.after[s.primary]
  const bars = (
    [
      ['Before', baseline, '#5479e8', s.beforeSamples],
      ['After', candidate, '#a253ca', s.afterSamples],
    ] as const
  )
    .map(([name, value, color, samples], i) => {
      const y = 80 + i * 100
      return `<text x="20" y="${y + 20}">${name}</text><rect x="${Math.min(scale(0), scale(value))}" y="${y}" width="${Math.max(1, Math.abs(scale(value) - scale(0)))}" height="28" fill="${color}" rx="3"/>
      <text x="${scale(value)}" y="${y - 10}" text-anchor="end">${format(value)} ${escapeHtml(comparison.unit)}</text>
      ${samples.map((sample, index) => `<circle cx="${scale(sample)}" cy="${y + 45 + (index % 3) * 6}" r="3" fill="${color}" opacity=".65"><title>Sample ${index + 1}: ${sample}</title></circle>`).join('')}`
    })
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="850" height="320" viewBox="0 0 850 320" role="img" aria-label="${escapeHtml(`${comparison.benchmark}: ${comparison.metric}`)}">
    <rect width="850" height="320" fill="#fff"/><g font-family="system-ui,sans-serif" font-size="14" fill="#1b2538">
    <text x="20" y="30" font-size="18" font-weight="600">${escapeHtml(comparison.metric)} · ${escapeHtml(comparison.scenario)} ${escapeHtml(comparison.cache)}</text>
    <text x="20" y="52">${s.primary}; ${s.before.count} complete pairs; every valid paired sample shown</text>${bars}
    <text x="20" y="285">Change: ${format(s.absoluteChange)} ${escapeHtml(comparison.unit)}${s.percentChange === null ? '' : ` (${format(s.percentChange)}%)`}; 95% paired CI: [${format(s.interval[0])}, ${format(s.interval[1])}]</text>
    <text x="20" y="308">${comparison.collector === 'bundles' ? 'Deterministic asset comparison' : s.inconclusive ? 'Inconclusive: small sample or confidence interval includes zero' : 'Confidence interval excludes zero; exploratory comparison'}</text></g></svg>`
}

export const flameSvg = (profile: any): string => {
  interface Frame {
    name: string
    value: number
    children: Map<number, Frame>
  }
  const nodes = new Map<number, any>(profile.nodes.map((node: any) => [node.id, node]))
  const parents = new Map<number, number>()
  for (const node of nodes.values()) for (const child of node.children ?? []) parents.set(child, node.id)
  const root: Frame = { name: 'Renderer CPU samples', value: 0, children: new Map() }
  for (let i = 0; i < (profile.samples?.length ?? 0); i++) {
    const stack: number[] = []
    let id: number | undefined = profile.samples[i]
    const visited = new Set<number>()
    while (id !== undefined && !visited.has(id)) {
      visited.add(id)
      stack.unshift(id)
      id = parents.get(id)
    }
    const duration = profile.timeDeltas?.[i] ?? 0
    if (!Number.isFinite(duration) || duration < 0) continue
    root.value += duration
    let current = root
    for (const frameId of stack) {
      if (!current.children.has(frameId))
        current.children.set(frameId, { name: nodes.get(frameId)?.callFrame?.functionName || '(anonymous)', value: 0, children: new Map() })
      current = current.children.get(frameId)!
      current.value += duration
    }
  }
  const rectangles: string[] = []
  let depth = 0
  const draw = (frame: Frame, x: number, width: number, level: number): void => {
    if (width < 0.5 || level > 60) return
    depth = Math.max(depth, level)
    const y = 45 + level * 22
    const color = `hsl(${20 + ((level * 13) % 45)} 80% ${65 + (level % 4) * 4}%)`
    rectangles.push(
      `<g><title>${escapeHtml(frame.name)}: ${format(frame.value / 1000)}ms inclusive</title><rect x="${x}" y="${y}" width="${width}" height="21" fill="${color}" stroke="white"/>${width > 70 ? `<text x="${x + 3}" y="${y + 15}">${escapeHtml(frame.name.slice(0, Math.floor(width / 7)))}</text>` : ''}</g>`,
    )
    let offset = x
    for (const child of frame.children.values()) {
      const size = frame.value ? (child.value / frame.value) * width : 0
      draw(child, offset, size, level + 1)
      offset += size
    }
  }
  draw(root, 10, 1180, 0)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${70 + depth * 22}" font-family="system-ui,sans-serif" font-size="12"><rect width="100%" height="100%" fill="white"/><text x="10" y="25" font-size="18">Renderer CPU flame chart · inclusive sampled time</text>${rectangles.join('')}</svg>`
}

export const findResults = async (directory: string): Promise<string[]> => {
  const paths: string[] = []
  const visit = async (path: string): Promise<void> => {
    for (const entry of await readdir(path, { withFileTypes: true }).catch(() => [])) {
      if (entry.isDirectory()) await visit(join(path, entry.name))
      else if (entry.name === 'result.json') paths.push(join(path, entry.name))
    }
  }
  await visit(directory)
  return paths.sort()
}

export interface ReportOptions {
  input: string
  output: string
  benchmarks: Benchmark[]
  commits: { before: string; after: string }
  buildOutcomes?: string
  resultPaths?: string[]
}

export const validateReportDirectories = (inputPath: string, outputPath: string): void => {
  const input = resolve(inputPath)
  const output = resolve(outputPath)
  if (input === output || input.startsWith(output + sep) || output.startsWith(input + sep))
    throw new Error('Report input and output must be separate directories')
}

export const generateReport = async (inputOptions: ReportOptions) => {
  const canonical = selectBenchmarks(inputOptions.benchmarks.map((benchmark) => benchmark.id).join(','))
  if (canonical.length !== inputOptions.benchmarks.length) throw new Error('Expected benchmarks must be nonempty and unique')
  const options = {
    ...inputOptions,
    benchmarks: inputOptions.benchmarks.map((benchmark) => canonical.find((entry) => entry.id === benchmark.id)!),
  }
  validateReportDirectories(options.input, options.output)
  await mkdir(join(options.output, 'charts'), { recursive: true })
  const paths = options.resultPaths ?? (await findResults(options.input))
  const diagnostics: string[] = []
  const results = new Map<string, Result>()
  const resultDirectories = new Map<string, string>()
  for (const path of paths) {
    try {
      const raw = await readJson<Result>(path)
      const expected = options.benchmarks.find((benchmark) => benchmark.id === raw.benchmark?.id)
      if (!expected) {
        diagnostics.push(`Unexpected result ignored: ${relative(options.input, path)}`)
        continue
      }
      const result = validateResult(raw, expected, options.commits)
      if (results.has(expected.id)) {
        diagnostics.push(`Duplicate benchmark result ignored: ${expected.id}`)
        continue
      }
      results.set(expected.id, result)
      resultDirectories.set(expected.id, dirname(path))
    } catch (error) {
      diagnostics.push(`${relative(options.input, path)}: ${errorMessage(error)}`)
    }
  }
  const comparisons: Comparison[] = []
  const coverage: { benchmark: string; status: Status; pairs: number; requested: number; diagnostics: string[] }[] = []
  const sections: string[] = []
  const smoke = options.benchmarks.some((b) => b.collector === 'smoke')
    ? await reportSmoke(options.input, options.output, options.commits)
    : undefined
  for (const benchmark of options.benchmarks.filter((b) => b.collector !== 'smoke')) {
    const result = results.get(benchmark.id)
    let entries: Comparison[] = []
    try {
      if (result) entries = comparisonsFor(result)
    } catch (error) {
      diagnostics.push(`${benchmark.id}: ${errorMessage(error)}`)
    }
    comparisons.push(...entries)
    const pairs = entries.length ? Math.max(...entries.map((entry) => entry.statistics.before.count)) : 0
    const status = !result
      ? 'missing'
      : !entries.length && ['success', 'partial'].includes(result.status)
        ? 'failed'
        : result.status === 'success' && pairs < result.requestedSamples
          ? 'partial'
          : result.status
    const messages = result
      ? [
          ...result.diagnostics,
          ...result.samples.flatMap((sample) => sample.diagnostics.map((message) => `${sample.revision} #${sample.pair + 1}: ${message}`)),
        ]
      : ['No result artifact was uploaded']
    coverage.push({ benchmark: benchmark.id, status, pairs, requested: result?.requestedSamples ?? 0, diagnostics: messages })
    const chartHtml: string[] = []
    for (const entry of benchmark.collector === 'css-selectors' ? [] : entries) {
      const filename = `${benchmark.id}-${entry.metric.replace(/[^a-zA-Z0-9_-]/g, '_')}.svg`
      try {
        await writeFile(join(options.output, 'charts', filename), comparisonSvg(entry))
        const s = entry.statistics
        chartHtml.push(
          `<figure><img loading="lazy" src="charts/${href(filename)}" alt="${escapeHtml(entry.metric)} comparison"/><figcaption>${escapeHtml(entry.coverage)}<br/>Before: mean ${format(s.before.mean)}, median ${format(s.before.median)}, p95 ${format(s.before.p95)}, SD ${format(s.before.standardDeviation)}, min–max ${format(s.before.min)}–${format(s.before.max)}<br/>After: mean ${format(s.after.mean)}, median ${format(s.after.median)}, p95 ${format(s.after.p95)}, SD ${format(s.after.standardDeviation)}, min–max ${format(s.after.min)}–${format(s.after.max)}</figcaption></figure>`,
        )
      } catch (error) {
        diagnostics.push(`Chart ${filename}: ${errorMessage(error)}`)
      }
    }
    if (result && benchmark.collector === 'css-selectors' && entries.length) {
      const slowestFilename = `${benchmark.id}-slowest.html`
      await writeFile(join(options.output, 'charts', slowestFilename), selectorTableHtml(result))
      chartHtml.push(
        `<h3>Slowest CSS selectors</h3><p>Sortable selector name, time, matchAttempts, and matchCount. Switch between before and after; sorting selects the top 1,000 from all selectors. <a href="charts/${slowestFilename}">Open selector table</a>.</p><iframe loading="lazy" style="width:100%;height:900px;border:1px solid #e3e8f2" src="charts/${slowestFilename}" title="Sortable CSS selector statistics"></iframe>`,
      )
      const totalsFilename = `${benchmark.id}-totals.svg`
      const totals = entries.map((entry, index) => comparisonSvg(entry).replace('<svg ', `<svg y="${index * 320}" `)).join('')
      await writeFile(
        join(options.output, 'charts', totalsFilename),
        `<svg xmlns="http://www.w3.org/2000/svg" width="850" height="${entries.length * 320}" viewBox="0 0 850 ${entries.length * 320}" role="img" aria-label="CSS selector totals">${totals}</svg>`,
      )
      chartHtml.push(
        `<h3>CSS selector totals</h3><figure><img loading="lazy" src="charts/${totalsFilename}" alt="CSS selector totals before and after"/><figcaption>All selectors; elapsed matching time uses medians, counts use means. Each panel has its own scale. Selector instrumentation adds overhead.</figcaption></figure>`,
      )
      const filename = `${benchmark.id}-details.svg`
      try {
        await writeFile(join(options.output, 'charts', filename), selectorDetailsSvg(result))
        chartHtml.push(
          `<h3>Selector details</h3><p>Up to 3,000 selectors, sorted by the larger before/after median. Totals above include every selector. <a href="charts/${filename}">Open full chart</a>.</p><iframe loading="lazy" style="width:100%;height:900px;border:1px solid #e3e8f2" src="charts/${filename}" title="CSS selector before and after details"></iframe>`,
        )
      } catch (error) {
        diagnostics.push(`CSS selector details: ${errorMessage(error)}`)
      }
    }
    if (result && benchmark.collector === 'profile') {
      for (const sample of result.samples)
        for (const path of sample.raw.filter((path) => path.endsWith('.cpuprofile'))) {
          try {
            const profile = await readJson(join(resultDirectories.get(benchmark.id)!, path))
            const filename = `${benchmark.id}-${sample.revision}-${sample.pair}.svg`
            await writeFile(join(options.output, 'charts', filename), flameSvg(profile))
            chartHtml.push(
              `<details><summary>${sample.revision} profile #${sample.pair + 1}</summary><img loading="lazy" src="charts/${href(filename)}" alt="Renderer flame chart"/></details>`,
            )
          } catch (error) {
            diagnostics.push(`Profile ${benchmark.id}/${path}: ${errorMessage(error)}`)
          }
        }
    }
    if (result && benchmark.collector === 'bundles') {
      try {
        const changes = await readJson<{ path: string; status: string; before: number; after: number; delta: number }[]>(
          join(resultDirectories.get(benchmark.id)!, 'bundle-changes.json'),
        )
        chartHtml.push(
          `<h3>Largest asset changes</h3><table><thead><tr><th>Asset</th><th>Status</th><th>Before bytes</th><th>After bytes</th><th>Change</th></tr></thead><tbody>${changes
            .slice(0, 30)
            .map(
              (asset) =>
                `<tr><td>${escapeHtml(asset.path)}</td><td>${asset.status}</td><td>${format(asset.before)}</td><td>${format(asset.after)}</td><td>${format(asset.delta)}</td></tr>`,
            )
            .join('')}</tbody></table>`,
        )
      } catch (error) {
        diagnostics.push(`Bundle details: ${errorMessage(error)}`)
      }
    }
    const rawFiles =
      result?.samples
        .flatMap((sample) => sample.raw.map((path) => `<li>${escapeHtml(`${sample.revision} #${sample.pair + 1}: ${path}`)}</li>`))
        .join('') ?? ''
    const artifact = relative(options.input, resultDirectories.get(benchmark.id) ?? options.input).split(sep)[0]
    const artifactName = artifact?.startsWith('large-result-') ? artifact : `large-result-${benchmark.id}`
    sections.push(`<section class="benchmark" data-startup="${benchmark.startup}" data-collector="${benchmark.collector}" data-id="${benchmark.id}" data-search="${escapeHtml(entries.map((entry) => entry.metric).join(' '))}"><h2>${escapeHtml(benchmark.id)} <span class="badge ${status}">${status}</span></h2>
      <p>${pairs}/${result?.requestedSamples ?? '?'} complete pairs. ${benchmark.diagnostic ? 'Diagnostic collector; instrumentation changes execution.' : ''}</p>${chartHtml.join('')}
      <details><summary>Diagnostics, runner metadata, and raw results</summary><pre>${escapeHtml(JSON.stringify({ runner: result?.runner, diagnostics: messages }, null, 2))}</pre>${result ? `<p>Raw evidence is stored separately in the <code>${escapeHtml(artifactName)}</code> workflow artifact (or the original input directory for local runs).</p>` : ''}<ul>${rawFiles}</ul></details></section>`)
  }
  if (smoke) coverage.push({ benchmark: 'smoke-tests', status: smoke.status, pairs: 0, requested: 0, diagnostics: smoke.diagnostics })
  const validRuntime = comparisons.filter((entry) => entry.collector !== 'bundles').length
  const buildsFailed = options.buildOutcomes !== undefined && options.buildOutcomes !== 'success,success'
  const expectsRuntime = options.benchmarks.some((benchmark) => benchmark.collector !== 'bundles')
  const usable = (expectsRuntime ? validRuntime > 0 || !!smoke?.usable : comparisons.length > 0) && !buildsFailed
  const buildStatuses: unknown[] = []
  for (const entry of await readdir(options.input, { withFileTypes: true }).catch(() => [])) {
    if (!entry.isDirectory() || !entry.name.startsWith('large-build-status-')) continue
    try {
      buildStatuses.push(await readJson(join(options.input, entry.name, 'status.json')))
    } catch (error) {
      diagnostics.push(`Build status ${entry.name}: ${errorMessage(error)}`)
    }
  }
  const summary = {
    schemaVersion: 1,
    commits: options.commits,
    generatedAt: new Date().toISOString(),
    usable,
    buildOutcomes: options.buildOutcomes ?? 'local executables',
    buildStatuses,
    coverage,
    comparisons,
    smoke,
    diagnostics,
  }
  const heatmap = comparisons
    .map((entry) => {
      const s = entry.statistics
      const change = s.percentChange === null ? `${format(s.absoluteChange)} ${entry.unit}` : `${format(s.percentChange)}%`
      const better = s.absoluteChange < 0 !== entry.higherIsBetter
      return `<tr data-startup="${entry.startup}" data-collector="${entry.collector}" data-id="${entry.benchmark}"><td><a href="#${entry.benchmark}">${escapeHtml(entry.benchmark)}</a></td><td>${escapeHtml(entry.metric)}</td><td>${format(s.before[s.primary])}</td><td>${format(s.after[s.primary])}</td><td class="${s.inconclusive || s.absoluteChange === 0 ? 'uncertain' : better ? 'better' : 'worse'}" title="95% paired CI: ${s.interval.join(' to ')} ${escapeHtml(entry.unit)}">${change}</td><td>${s.before.count}</td><td>${entry.collector === 'bundles' ? 'Static' : s.inconclusive ? 'Inconclusive' : 'CI excludes zero'}</td></tr>`
    })
    .join('')
  const columns = new Map<string, Comparison>()
  for (const entry of comparisons) columns.set(`${entry.collector}:${entry.metric}`, entry)
  const groups = new Map<string, Comparison[]>()
  for (const entry of comparisons) {
    const name = entry.startup ? `startup-${entry.scenario}-${entry.cache}` : entry.scenario
    const entries = groups.get(name) ?? []
    entries.push(entry)
    groups.set(name, entries)
  }
  const familyOrder = ['timing', 'instructions', 'resources', 'renderer', 'timeline', 'memory', 'profile', 'bundles']
  const orderedColumns = [...columns.values()].sort((a, b) => familyOrder.indexOf(a.collector) - familyOrder.indexOf(b.collector))
  const matrix = `<div class="table-wrap"><table class="heatmap"><thead><tr><th>Scenario</th>${orderedColumns
    .map((entry) => `<th data-matrix-collector="${entry.collector}">${escapeHtml(entry.collector)}<br/>${escapeHtml(entry.metric)}</th>`)
    .join('')}</tr></thead><tbody>${[...groups]
    .map(
      ([name, entries]) =>
        `<tr data-matrix-row><th>${escapeHtml(name)}</th>${orderedColumns
          .map((column) => {
            const entry = entries.find((candidate) => candidate.collector === column.collector && candidate.metric === column.metric)
            const s = entry?.statistics
            const value = !s ? '—' : s.percentChange === null ? `${format(s.absoluteChange)} ${column.unit}` : `${format(s.percentChange)}%`
            const color =
              !s || s.inconclusive || s.absoluteChange === 0
                ? 'uncertain'
                : s.absoluteChange < 0 !== entry!.higherIsBetter
                  ? 'better'
                  : 'worse'
            const title = !s
              ? 'No comparable data'
              : `${column.metric}: ${s.before.count} complete pairs; 95% paired CI ${s.interval.map(format).join(' to ')} ${column.unit}`
            return `<td class="${color}" data-startup="${entries[0]!.startup}" data-collector="${column.collector}" data-id="${entry?.benchmark ?? name + '-' + column.collector}" data-search="${escapeHtml(column.metric)}" data-comparable="${!!entry}" title="${escapeHtml(title)}">${entry ? `<a href="#${entry.benchmark}">${escapeHtml(value)}</a>` : value}</td>`
          })
          .join('')}</tr>`,
    )
    .join('')}</tbody></table></div>`
  const counts = Object.fromEntries(
    (['success', 'partial', 'failed', 'unavailable', 'missing'] as const).map((status) => [
      status,
      coverage.filter((entry) => entry.status === status).length,
    ]),
  )
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Large Performance · VS Code comparison</title><style>
    :root{color-scheme:light;font-family:system-ui,sans-serif;color:#1b2538;background:#f4f6fb}body{max-width:1350px;margin:auto;padding:36px}header,section,.overview{background:white;border:1px solid #dde3ef;border-radius:12px;padding:24px;margin-bottom:24px}h1{margin:0 0 12px;font-size:34px}h2{font-size:22px}p,figcaption{line-height:1.6}code{overflow-wrap:anywhere}.stats{display:flex;gap:12px;flex-wrap:wrap}.stats span{background:#eef1f8;border-radius:8px;padding:14px}.table-wrap{overflow:auto}.heatmap th,.heatmap td{min-width:95px;text-align:center}.heatmap tbody th{position:sticky;left:0;top:auto;background:#f7f9fd;text-align:left;min-width:170px;z-index:1}table{border-collapse:collapse;width:100%;font-size:13px}th,td{text-align:left;border-bottom:1px solid #e3e8f2;padding:10px;overflow-wrap:anywhere}th{position:sticky;top:0;background:#edf1fa}.better{background:#e0f3e8}.worse{background:#fae3e3}.uncertain{background:#eef0f4}.badge{font-size:12px;border-radius:20px;padding:5px 9px;background:#eef0f4}.success{background:#e0f3e8}.failed{background:#fae3e3}figure{margin:16px 0;border:1px solid #e3e8f2;border-radius:8px;padding:14px}img{max-width:100%;height:auto}figcaption{font-size:12px;color:#566078}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}select,input{font:inherit;padding:8px;border:1px solid #ccd4e3;border-radius:6px}nav{display:flex;gap:12px;margin:20px 0;flex-wrap:wrap}a{color:#315abd}details{margin:12px 0}summary{cursor:pointer}.benchmark[hidden],tr[hidden]{display:none}@media(max-width:700px){body{padding:12px}header,section,.overview{padding:14px}.table-wrap{overflow:auto}h1{font-size:27px}}
    </style></head><body><header><h1>Large Performance</h1><p>VS Code · Linux x64 · runtime collectors disable extensions and compare on the same runner; smoke tests use independent runners and their test extensions</p><p><strong>Before:</strong> <code>${escapeHtml(options.commits.before)}</code><br/><strong>After:</strong> <code>${escapeHtml(options.commits.after)}</code></p>
    <p>${usable ? 'Comparison complete. Regressions and individual measurement failures are informational.' : 'Comparison incomplete: unusable builds or no valid runtime comparison. Available evidence is preserved below.'}</p>
    <div class="stats">${Object.entries(counts)
      .map(([name, value]) => `<span><strong>${value}</strong> ${name}</span>`)
      .join('')}</div>
    <details><summary>How to read the measurements</summary><p>Counts and byte sizes use means; timings use medians. Only complete pairs are compared. No outliers were removed. Runtime confidence intervals use 10,000 deterministic paired bootstrap resamples. These are exploratory intervals across many metrics, without a multiple-comparison significance claim. Small samples and intervals crossing zero are inconclusive. Hardware counters may be unavailable on the runner; missing values are never zeros.</p></details>
    <nav><label>View <select id="view"><option value="all">All measurements</option><option value="startup">Startup</option><option value="editor">Editor and interactions</option><option value="timing">Timings</option><option value="instructions">Instruction counts</option><option value="resources">OS resources</option><option value="timeline">Rendering traces</option><option value="css-selectors">CSS selectors</option><option value="renderer">Renderer counters</option><option value="bundles">Bundle sizes</option><option value="profile">CPU profiles</option><option value="memory">Memory</option></select></label><label>Filter <input id="filter" type="search" placeholder="Benchmark or metric"/></label></nav></header>
    <div class="overview"><h2>Performance overview</h2><p>Green indicates improvement, red indicates regression, and gray indicates an inconclusive or unchanged result. Hover for confidence intervals; select a view to focus on a collector family. Click a value to open its charts.</p>${matrix}<details><summary>Detailed comparison table</summary><div class="table-wrap"><table><thead><tr><th>Benchmark</th><th>Metric</th><th>Before</th><th>After</th><th>Change</th><th>Pairs</th><th>Confidence</th></tr></thead><tbody>${heatmap}</tbody></table></div></details></div>
    <section><h2>Coverage</h2><details><summary>All benchmark outcomes</summary><table><thead><tr><th>Benchmark</th><th>Status</th><th>Complete pairs</th></tr></thead><tbody>${coverage.map((entry) => `<tr><td>${escapeHtml(entry.benchmark)}</td><td>${entry.status}</td><td>${entry.benchmark === 'smoke-tests' ? 'Independent attempts; see smoke results' : `${entry.pairs}/${entry.requested || '?'}`} </td></tr>`).join('')}</tbody></table></details><details><summary>Report diagnostics and build outcomes</summary><pre>${escapeHtml(JSON.stringify({ buildOutcomes: summary.buildOutcomes, buildStatuses, diagnostics }, null, 2))}</pre></details></section>
    ${smoke ? `<section id="smoke-tests"><h2>Smoke test timings</h2>${smoke.html}${smoke.usable ? '<img src="charts/smoke-tests.svg" alt="Mean and median smoke test timing comparison"/>' : ''}</section>` : ''}
    ${sections.map((section, index) => section.replace('<section ', `<section id="${options.benchmarks.filter((b) => b.collector !== 'smoke')[index]!.id}" `)).join('')}
    <script>const view=document.getElementById('view'), filter=document.getElementById('filter'); function update(){const mode=view.value,q=filter.value.toLowerCase();for(const el of document.querySelectorAll('[data-id]')){const matches=mode==='all'||mode==='startup'&&el.dataset.startup==='true'||mode==='editor'&&el.dataset.startup==='false'&&!['bundles','resources','profile','memory'].includes(el.dataset.collector)||mode===el.dataset.collector;el.hidden=!matches||!(el.textContent+' '+el.dataset.id+' '+(el.dataset.search||'')).toLowerCase().includes(q)}for(const row of document.querySelectorAll('[data-matrix-row]'))row.hidden=Array.from(row.querySelectorAll('td')).every(cell=>cell.hidden||cell.dataset.comparable==='false');for(const column of document.querySelectorAll('[data-matrix-collector]'))column.hidden=!['all','startup','editor'].includes(mode)&&mode!==column.dataset.matrixCollector}view.addEventListener('change',update);filter.addEventListener('input',update)</script></body></html>`
  await writeFile(join(options.output, 'index.html'), html)
  return summary
}
