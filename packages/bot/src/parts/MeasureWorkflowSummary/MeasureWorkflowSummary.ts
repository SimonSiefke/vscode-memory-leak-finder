export type WorkflowArtifactNames = {
  readonly baseCharts?: string
  readonly baseResults?: string
  readonly baseVideo?: string
  readonly candidateCharts?: string
  readonly candidateResults?: string
  readonly candidateVideo?: string
  readonly summary: string
}

export type WorkflowStepOutcomes = {
  readonly baseMeasure: 'success' | 'failure' | 'skipped'
  readonly candidateMeasure: 'success' | 'failure' | 'skipped'
  readonly charts?: 'success' | 'failure' | 'skipped'
}

export type MeasureWorkflowSummary = {
  readonly actorLogin: string
  readonly artifacts: WorkflowArtifactNames
  readonly baseCommit: string
  readonly candidateRef: string
  readonly chartPaths?: {
    readonly base?: string
    readonly candidate?: string
  }
  readonly cliArgs: readonly string[]
  readonly conclusion: 'success' | 'failure'
  readonly error?: unknown
  readonly fixedFunctionNames?: readonly string[]
  readonly issueNumber: number
  readonly measure: string
  readonly requestId: string
  readonly sourceRepository: {
    readonly owner: string
    readonly repo: string
  }
  readonly statusCommentId: number
  readonly stepOutcomes: WorkflowStepOutcomes
  readonly workflowDurationMs?: number
  readonly workflowRun: {
    readonly id: number
    readonly url: string
  }
}

export type CommentArtifactLink = {
  readonly name: string
  readonly url: string
}

export type CommentChartEmbed = {
  readonly alt: string
  readonly label: string
  readonly url: string
}

export type CommentVideoEmbed = {
  readonly label: string
  readonly name: string
  readonly url: string
}
