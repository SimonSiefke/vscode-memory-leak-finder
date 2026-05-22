import type { CommentArtifactLink, CommentVideoEmbed, MeasureWorkflowSummary } from '../MeasureWorkflowSummary/MeasureWorkflowSummary.ts'

type RenderCompletionCommentOptions = {
  readonly artifacts: readonly CommentArtifactLink[]
  readonly summary: MeasureWorkflowSummary
  readonly videoEmbeds?: readonly CommentVideoEmbed[]
}

const renderArtifacts = (artifacts: readonly CommentArtifactLink[]): string => {
  if (artifacts.length === 0) {
    return 'No downloadable artifacts were found for this run.'
  }
  return artifacts.map((artifact) => `- [${artifact.name}](${artifact.url})`).join('\n')
}

const renderFailureVideos = (summary: MeasureWorkflowSummary, videoEmbeds: readonly CommentVideoEmbed[]): string => {
  if (summary.conclusion !== 'failure' || videoEmbeds.length === 0) {
    return ''
  }
  const renderedVideos = videoEmbeds.map((video) => `- ${video.label}: [${video.name}](${video.url})`).join('\n')
  return `\n### Failure videos\n\n${renderedVideos}\n`
}

export const renderCompletionComment = ({ artifacts, summary, videoEmbeds = [] }: RenderCompletionCommentOptions): string => {
  const heading = summary.conclusion === 'success' ? '## Measure run completed' : '## Measure run failed'
  const artifactsBlock =
    summary.conclusion === 'success'
      ? `
### Artifacts

${renderArtifacts(artifacts)}
`
      : ''
  const errorBlock =
    summary.error === undefined
      ? ''
      : `\n<details>\n<summary>Error details</summary>\n\n\`\`\`json\n${JSON.stringify(summary.error, null, 2)}\n\`\`\`\n</details>\n`
  const failureVideosBlock = renderFailureVideos(summary, videoEmbeds)

  return `${heading}

- Measure: ${summary.measure}
- Base commit: ${summary.baseCommit}
- Candidate ref: ${summary.candidateRef}
- Workflow: ${summary.workflowRun.url}
${failureVideosBlock}
${artifactsBlock}

<details>
<summary>Summary JSON</summary>

\`\`\`json
${JSON.stringify(summary, null, 2)}
\`\`\`
</details>${errorBlock}`
}
