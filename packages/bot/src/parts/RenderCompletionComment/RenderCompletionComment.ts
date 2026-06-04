import type { CommentChartEmbed, CommentVideoEmbed, MeasureWorkflowSummary } from '../MeasureWorkflowSummary/MeasureWorkflowSummary.ts'

type RenderCompletionCommentOptions = {
  readonly chartEmbeds?: readonly CommentChartEmbed[]
  readonly summary: MeasureWorkflowSummary
  readonly videoEmbeds?: readonly CommentVideoEmbed[]
}

const getTscErrorLines = (error: unknown): readonly string[] => {
  if (!error || typeof error !== 'object' || Array.isArray(error)) {
    return []
  }
  const value = (error as { readonly tscErrorLines?: unknown }).tscErrorLines
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is string => typeof item === 'string')
}

const renderCompilerOutput = (summary: MeasureWorkflowSummary): string => {
  if (summary.conclusion !== 'failure') {
    return ''
  }
  const tscErrorLines = getTscErrorLines(summary.error)
  if (tscErrorLines.length === 0) {
    return ''
  }
  return `
### Compiler output

\`\`\`text
${tscErrorLines.join('\n')}
\`\`\`
`
}

const renderFixedFunctionsSummary = (summary: MeasureWorkflowSummary): string => {
  const fixedFunctionNames = summary.fixedFunctionNames || []
  if (fixedFunctionNames.length === 0) {
    return ''
  }
  if (fixedFunctionNames.length <= 3) {
    return `Leaks: ${fixedFunctionNames.join(', ')}.`
  }
  return `Leaks: ${fixedFunctionNames.slice(0, 3).join(', ')}, and some others.`
}

const renderFailureVideos = (summary: MeasureWorkflowSummary, videoEmbeds: readonly CommentVideoEmbed[]): string => {
  if (summary.conclusion !== 'failure' || videoEmbeds.length === 0) {
    return ''
  }
  const renderedVideos = videoEmbeds.map((video) => `- ${video.label}: [${video.name}](${video.url})`).join('\n')
  return `\n### Failure videos\n\n${renderedVideos}\n`
}

const renderCharts = (summary: MeasureWorkflowSummary, chartEmbeds: readonly CommentChartEmbed[]): string => {
  if (summary.conclusion !== 'success') {
    return ''
  }
  const fixedFunctionsSummary = renderFixedFunctionsSummary(summary)
  const beforeChart = chartEmbeds.find((chart) => chart.label === 'Before')
  const afterChart = chartEmbeds.find((chart) => chart.label === 'After')
  const beforeContent = [
    fixedFunctionsSummary,
    beforeChart ? `<img alt="${beforeChart.alt}" src="${beforeChart.url}" />` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
  const afterContent = afterChart
    ? `<img alt="${afterChart.alt}" src="${afterChart.url}" />`
    : summary.fixedFunctionNames?.length && !summary.chartPaths?.candidate
      ? 'No more leaks detected'
      : 'No leak details available.'

  return `
### Before

${beforeContent || 'No leak details available.'}

### After

${afterContent}
`
}

export const renderCompletionComment = ({ chartEmbeds = [], summary, videoEmbeds = [] }: RenderCompletionCommentOptions): string => {
  const heading = summary.conclusion === 'success' ? '## Measure run completed' : '## Measure run failed'
  const compilerOutputBlock = renderCompilerOutput(summary)
  const errorBlock =
    summary.error === undefined
      ? ''
      : `\n<details>\n<summary>Error details</summary>\n\n\`\`\`json\n${JSON.stringify(summary.error, null, 2)}\n\`\`\`\n</details>\n`
  const chartsBlock = renderCharts(summary, chartEmbeds)
  const failureVideosBlock = renderFailureVideos(summary, videoEmbeds)

  return `${heading}

- Measure: ${summary.measure}
- Base commit: ${summary.baseCommit}
- Candidate ref: ${summary.candidateRef}
- Workflow: ${summary.workflowRun.url}
${compilerOutputBlock}
${chartsBlock}
${failureVideosBlock}

<details>
<summary>Summary JSON</summary>

\`\`\`json
${JSON.stringify(summary, null, 2)}
\`\`\`
</details>${errorBlock}`
}
