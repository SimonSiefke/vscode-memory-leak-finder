import type { CommentArtifactLink, MeasureWorkflowSummary } from '../MeasureWorkflowSummary/MeasureWorkflowSummary.ts'

type RenderCompletionCommentOptions = {
  readonly artifacts: readonly CommentArtifactLink[]
  readonly summary: MeasureWorkflowSummary
}

const renderArtifacts = (artifacts: readonly CommentArtifactLink[]): string => {
  if (artifacts.length === 0) {
    return 'No downloadable artifacts were found for this run.'
  }
  return artifacts.map((artifact) => `- [${artifact.name}](${artifact.url})`).join('\n')
}

export const renderCompletionComment = ({ artifacts, summary }: RenderCompletionCommentOptions): string => {
  const heading = summary.conclusion === 'success' ? '## Measure run completed' : '## Measure run failed'
  const errorBlock =
    summary.error === undefined
      ? ''
      : `\n<details>\n<summary>Error details</summary>\n\n\`\`\`json\n${JSON.stringify(summary.error, null, 2)}\n\`\`\`\n</details>\n`

  return `${heading}

- Measure: ${summary.measure}
- Base commit: ${summary.baseCommit}
- Candidate ref: ${summary.candidateRef}
- Workflow: ${summary.workflowRun.url}

### Artifacts

${renderArtifacts(artifacts)}

<details>
<summary>Summary JSON</summary>

\`\`\`json
${JSON.stringify(summary, null, 2)}
\`\`\`
</details>${errorBlock}`
}
