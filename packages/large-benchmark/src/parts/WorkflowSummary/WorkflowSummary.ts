import type { Comparison, generateReport } from '../Report/Report.ts'

type ReportSummary = Pick<Awaited<ReturnType<typeof generateReport>>, 'commits' | 'comparisons' | 'coverage' | 'usable'>

const cell = (value: string): string =>
  value.replace(/[&<>|`*_\[\]\\]/g, (character) => `&#${character.charCodeAt(0)};`).replace(/\r?\n/g, ' ')
const format = (value: number): string => value.toLocaleString('en-US', { maximumFractionDigits: 3 })
const signed = (value: number): string => `${value > 0 ? '+' : ''}${format(value)}`

const comparisonRow = (entry: Comparison): string => {
  const s = entry.statistics
  const percent = s.percentChange === null ? 'N/A' : `${signed(s.percentChange)}%`
  const assessment =
    s.absoluteChange === 0
      ? 'Unchanged'
      : s.inconclusive
        ? 'Inconclusive'
        : s.absoluteChange < 0 !== entry.higherIsBetter
          ? 'Improvement'
          : 'Regression'
  return `| ${cell(entry.benchmark)} | ${cell(entry.metric)} (${cell(entry.coverage)}) | ${format(s.before[s.primary])} ${cell(entry.unit)} | ${format(s.after[s.primary])} ${cell(entry.unit)} | ${signed(s.absoluteChange)} ${cell(entry.unit)} (${percent}) | ${s.before.count} | ${entry.collector === 'bundles' ? 'Static' : `${s.interval.map(format).join(' to ')} ${cell(entry.unit)}`} | ${assessment} |`
}

export const createWorkflowSummary = (summary: ReportSummary): string => {
  const groups = new Map<string, Comparison[]>()
  for (const entry of summary.comparisons) {
    const entries = groups.get(entry.collector) ?? []
    entries.push(entry)
    groups.set(entry.collector, entries)
  }
  const tables = [...groups].map(
    ([collector, entries]) =>
      `### ${cell(collector)}\n\n| Benchmark | Metric (coverage) | Before | After | Change | Complete pairs | 95% paired CI of change | Result |\n| --- | --- | ---: | ---: | ---: | ---: | --- | --- |\n${entries.map(comparisonRow).join('\n')}\n`,
  )
  return [
    '## Large Performance',
    `Before: <code>${cell(summary.commits.before)}</code>`,
    `After: <code>${cell(summary.commits.after)}</code>`,
    `${summary.comparisons.length} metric comparisons. Download **large-performance-report** and open \`index.html\` for charts and full distributions.`,
    ...(summary.usable ? [] : ['**Comparison incomplete:** unusable builds or no valid runtime comparisons. Available results are shown below.']),
    'Timings use medians; counts and byte sizes use means. Only complete sample pairs are compared. Change is after minus before; percentages are N/A when before is zero. Runtime confidence intervals are exploratory; small samples and intervals including zero are inconclusive. Bundle sizes are static comparisons.',
    ...(tables.length ? tables : ['No paired metric results are available.']),
    `<details>\n<summary>Benchmark coverage (${summary.coverage.length} jobs)</summary>\n\n| Benchmark | Status | Complete pairs |\n| --- | --- | ---: |\n${summary.coverage.map((entry) => `| ${cell(entry.benchmark)} | ${cell(entry.status)} | ${entry.pairs}/${entry.requested || '?'} |`).join('\n')}\n\n</details>`,
  ].join('\n\n') + '\n'
}
