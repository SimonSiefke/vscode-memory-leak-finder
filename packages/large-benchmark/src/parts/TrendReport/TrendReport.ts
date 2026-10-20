import { access, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { commitLabel } from '../CommitReference/CommitReference.ts'
import { errorMessage, readJson } from '../Io/Io.ts'
import { escapeHtml, findResults, generateReport, validateReportDirectories, type Comparison } from '../Report/Report.ts'
import { commitPairs, validateCommits, type SeriesManifest } from '../Series/Series.ts'
import type { Result } from '../Types/Types.ts'

type PairReport = Awaited<ReturnType<typeof generateReport>>
const format = (value: number): string => value.toLocaleString('en-US', { maximumFractionDigits: 3 })
const key = (entry: Comparison): string => JSON.stringify([entry.benchmark, entry.metric, entry.unit, entry.coverage])

export interface Trend {
  benchmark: string
  metric: string
  unit: string
  coverage: string
  higherIsBetter: boolean
  points: (number | null)[]
  segments: { start: number; end: number }[]
  changes: (Comparison | null)[]
  overallPercent: number | null
}

// Chain within-runner ratios rather than treating absolute timings from different runners as paired observations.
export const trendsFor = (reports: PairReport[]): Trend[] => {
  const metrics = new Map(reports.flatMap((report) => report.comparisons.map((entry) => [key(entry), entry] as const)))
  return [...metrics].map(([id, metric]) => {
    const changes = reports.map((report) => report.comparisons.find((entry) => key(entry) === id) ?? null)
    const points: (number | null)[] = Array(changes.length + 1).fill(null)
    const segments: Trend['segments'] = []
    for (const [index, entry] of changes.entries()) {
      const s = entry?.statistics
      const ratio = s && s.before[s.primary] > 0 && s.after[s.primary] >= 0 ? s.after[s.primary] / s.before[s.primary] : null
      if (ratio === null) continue
      const previous = points[index] ?? 100
      const next = previous * ratio
      if (!Number.isFinite(next)) continue
      points[index] = previous
      points[index + 1] = next
      const segment = segments.at(-1)
      if (segment?.end === index) segment.end = index + 1
      else segments.push({ start: index, end: index + 1 })
    }
    const last = points.at(-1)!
    const complete = segments.length === 1 && segments[0]!.start === 0 && segments[0]!.end === changes.length
    return {
      benchmark: metric.benchmark,
      metric: metric.metric,
      unit: metric.unit,
      coverage: metric.coverage,
      higherIsBetter: metric.higherIsBetter,
      points,
      segments,
      changes,
      overallPercent: complete && last !== null ? last - 100 : null,
    }
  })
}

export const trendSvg = (trend: Trend, commits: string[], labels = commits.map(commitLabel)): string => {
  const values = [100, ...trend.points.filter((point): point is number => point !== null)]
  const min = Math.min(...values) * 0.95
  const max = Math.max(...values) * 1.05
  const x = (index: number): number => 70 + (index / (commits.length - 1)) * 1000
  const y = (value: number): number => 260 - ((value - min) / (max - min || 1)) * 190
  const lines = trend.segments
    .flatMap(({ start, end }) =>
      Array.from(
        { length: end - start },
        (_, offset) =>
          `<line x1="${x(start + offset)}" y1="${y(trend.points[start + offset]!)}" x2="${x(start + offset + 1)}" y2="${y(trend.points[start + offset + 1]!)}" stroke="#5479e8" stroke-width="2"/>`,
      ),
    )
    .join('')
  const dots = trend.points
    .map((point, index) =>
      point === null
        ? ''
        : `<circle cx="${x(index)}" cy="${y(point)}" r="4" fill="#5479e8"><title>#${index + 1} ${escapeHtml(labels[index])} (${commits[index]}): ${format(point)}</title></circle>`,
    )
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1140" height="330" viewBox="0 0 1140 330" role="img" aria-label="${escapeHtml(`${trend.benchmark}: ${trend.metric} trend`)}"><rect width="1140" height="330" fill="white"/><g font-family="system-ui,sans-serif" fill="#1b2538"><text x="20" y="25" font-size="18">${escapeHtml(trend.benchmark)} · ${escapeHtml(trend.metric)}</text><text x="20" y="48">Relative index; each measured range starts at 100; ${trend.higherIsBetter ? 'higher' : 'lower'} is better</text><text x="5" y="80">${format(max)}</text><text x="5" y="260">${format(min)}</text><line x1="70" x2="1070" y1="${y(100)}" y2="${y(100)}" stroke="#aaa" stroke-dasharray="4"/>${lines}${dots}<text x="70" y="295">#1 ${escapeHtml(labels[0])}</text><text x="1070" y="295" text-anchor="end">#${commits.length} ${escapeHtml(labels.at(-1))}</text><text x="20" y="320">Commit spacing follows input order. Hover for hashes and values. Missing links separate ranges; compare within each range.</text></g></svg>`
}

export const generateTrendReport = async (options: { input: string; output: string; manifest: SeriesManifest }) => {
  validateReportDirectories(options.input, options.output)
  const commits = validateCommits(options.manifest.commits)
  const releases = options.manifest.releases
  if (
    releases &&
    (!Array.isArray(releases) ||
      releases.length !== commits.length ||
      releases.some((release, index) => release?.commit !== commits[index] || typeof release?.version !== 'string'))
  )
    throw new Error('Invalid release labels in benchmark manifest')
  const labels = commits.map((commit, index) => releases?.[index]?.version ?? commitLabel(commit))
  const pairs = commitPairs(commits)
  const paths = new Map(pairs.map((pair) => [`${pair.before}:${pair.after}`, [] as string[]]))
  const diagnostics: string[] = []
  for (const path of await findResults(options.input)) {
    try {
      const result = await readJson<Result>(path)
      const group = paths.get(`${result.commits?.before}:${result.commits?.after}`)
      if (group) group.push(path)
      else diagnostics.push(`${path}: result commits do not match an adjacent pair`)
    } catch (error) {
      diagnostics.push(`${path}: ${errorMessage(error)}`)
    }
  }
  const reports: PairReport[] = []
  for (const pair of pairs)
    reports.push(
      await generateReport({
        input: options.input,
        output: join(options.output, pair.id),
        benchmarks: options.manifest.benchmarks,
        commits: { before: pair.before, after: pair.after },
        resultPaths: paths.get(`${pair.before}:${pair.after}`)!,
      }),
    )
  const selectorSections: string[] = []
  for (const benchmark of options.manifest.benchmarks.filter((entry) => entry.collector === 'css-selectors')) {
    const links: string[] = []
    let latestChart = ''
    let latestPair = -1
    for (const [index, pair] of pairs.entries()) {
      const chart = `${pair.id}/charts/${benchmark.id}-slowest.svg`
      if (
        !(await access(join(options.output, chart)).then(
          () => true,
          () => false,
        ))
      )
        continue
      latestChart = chart
      latestPair = index
      links.push(`<a href="${chart}">${escapeHtml(labels[index])} → ${escapeHtml(labels[index + 1])}</a>`)
    }
    if (latestPair >= 0)
      selectorSections.push(
        `<section><h2>Slowest CSS selectors · ${escapeHtml(benchmark.id)}</h2><p>Latest measured comparison: ${escapeHtml(labels[latestPair])} → ${escapeHtml(labels[latestPair + 1])}. Top 20 by the larger before/after median total matching time during startup; identical selector text combined across stylesheets. Nested fragments are shown as Chromium recorded them.</p><a href="${latestChart}"><img src="${latestChart}" alt="Top 20 slowest CSS selectors"/></a><details><summary>Selector rankings for every measured comparison</summary>${links.join('<br/>')}</details></section>`,
      )
  }
  const trends = trendsFor(reports)
  await mkdir(join(options.output, 'charts'), { recursive: true })
  const sections: string[] = []
  for (const [index, trend] of trends.entries()) {
    const filename = `trend-${index + 1}.svg`
    await writeFile(join(options.output, 'charts', filename), trendSvg(trend, commits, labels))
    const rows = trend.changes
      .map((entry, pairIndex) => {
        const s = entry?.statistics
        const assessment =
          !entry || !s
            ? 'Missing'
            : s.absoluteChange === 0
              ? 'Unchanged'
              : s.inconclusive
                ? 'Inconclusive'
                : s.absoluteChange < 0 !== entry.higherIsBetter
                  ? 'Improvement'
                  : 'Regression'
        const confidence =
          entry?.collector === 'bundles' ? 'Static' : s ? `${s.interval.map(format).join(' to ')} ${escapeHtml(trend.unit)}` : '—'
        return `<tr><td><a href="${pairs[pairIndex]!.id}/index.html#${trend.benchmark}">${escapeHtml(labels[pairIndex])} → ${escapeHtml(labels[pairIndex + 1])}</a></td><td>${s ? format(s.before[s.primary]) : '—'}</td><td>${s ? format(s.after[s.primary]) : '—'}</td><td>${s?.percentChange === null || !s ? '—' : `${format(s.percentChange)}%`}</td><td>${confidence}</td><td>${s?.before.count ?? 0}</td><td>${assessment}</td></tr>`
      })
      .join('')
    sections.push(
      `<section><h2>${escapeHtml(trend.benchmark)} · ${escapeHtml(trend.metric)}</h2><p>${escapeHtml(trend.coverage)} · ${escapeHtml(trend.unit)}. Overall chained change: <strong>${trend.overallPercent === null ? 'Unavailable (missing or zero-baseline link)' : `${format(trend.overallPercent)}%`}</strong></p><img src="charts/${filename}" alt="${escapeHtml(trend.metric)} trend"/><details><summary>Changes between adjacent commits</summary><table><thead><tr><th>Commits</th><th>Before</th><th>After</th><th>Change</th><th>95% paired CI of change</th><th>Pairs</th><th>Result</th></tr></thead><tbody>${rows}</tbody></table></details></section>`,
    )
  }
  const usable = reports.every((report) => report.usable)
  await writeFile(
    join(options.output, 'index.html'),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Large Performance · Version trends</title><style>body{font:15px system-ui;color:#1b2538;max-width:1200px;margin:32px auto;padding:0 20px}section{margin:32px 0}img{max-width:100%;height:auto}table{border-collapse:collapse;width:100%}th,td{padding:8px;border-bottom:1px solid #ddd;text-align:left}code{word-break:break-all}</style></head><body><h1>Large Performance · Version trends</h1><p>${commits.length} commits · ${pairs.length} adjacent comparisons · Linux x64 · extensions disabled</p>${usable ? '' : '<p><strong>Comparison incomplete: one or more adjacent comparisons have no valid runtime results.</strong></p>'}<p>Input order defines version order. Runtime collectors measure each adjacent pair on the same runner with alternating sample order. Smoke tests use independent runners and show separate mean/median comparisons below. Timings use medians; counts and byte sizes use means. The relative index starts at 100 for each uninterrupted measured range and multiplies adjacent after/before ratios. It describes cumulative relative change, not absolute startup time or a direct first-to-last measurement. Runner differences and uncertainty can accumulate. Overall changes are descriptive; only individual pairs have exploratory confidence intervals. Missing or zero-baseline links separate the plotted ranges. Later ranges restart at 100 and have independent baselines; their index levels cannot be compared across gaps. The overall change is unavailable unless every link is valid.</p><details><summary>Commits, pair reports, and coverage</summary><ol>${commits.map((commit, index) => `<li><strong>${escapeHtml(labels[index])}</strong> · <code>${commit}</code>${index ? ` · <a href="pair-${index}/index.html">Comparison with #${index}</a> (${reports[index - 1]!.coverage.filter((entry) => entry.status === 'success').length}/${options.manifest.benchmarks.length} successful benchmarks)` : ''}</li>`).join('')}</ol></details>${reports.map((report, index) => (report.smoke ? `<section><h2>Smoke tests · comparison ${index + 1}</h2>${report.smoke.html}${report.smoke.usable ? `<img src="pair-${index + 1}/charts/smoke-tests.svg" alt="Smoke test mean and median"/>` : ''}</section>` : '')).join('')}${selectorSections.join('')}${sections.join('') || '<p>No paired metric results are available.</p>'}<details><summary>Diagnostics</summary><pre>${escapeHtml(diagnostics.join('\n'))}</pre></details></body></html>`,
  )
  return { commits, labels, reports, trends, usable, diagnostics }
}

export const createTrendWorkflowSummary = (summary: Awaited<ReturnType<typeof generateTrendReport>>): string =>
  `## Large Performance · Version trends\n\n${summary.commits.length} commits; ${summary.reports.length} adjacent comparisons. ${escapeHtml(summary.labels[0])} → ${escapeHtml(summary.labels.at(-1))}. Download **large-performance-report** and open \`index.html\` for trend charts, per-version changes, coverage, and distributions.\n\n${summary.usable ? '' : '**Comparison incomplete:** one or more adjacent comparisons have no valid runtime results.\n\n'}Overall change chains within-runner after/before ratios (first commit = 100); it is descriptive and has no aggregate confidence interval. Missing or zero-baseline links make the overall change unavailable; charts restart at 100 for each measured range without connecting across gaps.\n\n| Benchmark | Metric | Overall chained change | Available links |\n| --- | --- | ---: | ---: |\n${summary.trends.map((trend) => `| ${escapeHtml(trend.benchmark)} | ${escapeHtml(trend.metric).replaceAll('|', '&#124;').replace(/\r?\n/g, ' ')} | ${trend.overallPercent === null ? 'Unavailable' : `${format(trend.overallPercent)}%`} | ${trend.changes.filter(Boolean).length}/${summary.reports.length} |`).join('\n')}\n${summary.reports.map((report) => report.smoke?.summary ?? '').join('\n')}\n`
