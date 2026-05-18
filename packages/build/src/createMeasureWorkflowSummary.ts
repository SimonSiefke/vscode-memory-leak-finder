export type CreateMeasureWorkflowSummaryOptions = {
  readonly actorLogin: string
  readonly artifactNames: {
    readonly baseCharts?: string
    readonly baseResults?: string
    readonly candidateCharts?: string
    readonly candidateResults?: string
    readonly summary: string
  }
  readonly baseCommit: string
  readonly candidateRef: string
  readonly cliArgs: readonly string[]
  readonly conclusion: 'success' | 'failure'
  readonly error?: unknown
  readonly issueNumber: number
  readonly measure: string
  readonly requestId: string
  readonly sourceRepository: {
    readonly owner: string
    readonly repo: string
  }
  readonly statusCommentId: number
  readonly stepOutcomes: {
    readonly baseMeasure: 'success' | 'failure' | 'skipped'
    readonly candidateMeasure: 'success' | 'failure' | 'skipped'
    readonly charts?: 'success' | 'failure' | 'skipped'
  }
  readonly workflowRun: {
    readonly id: number
    readonly url: string
  }
}

export const createMeasureWorkflowSummary = (options: CreateMeasureWorkflowSummaryOptions) => {
  return {
    actorLogin: options.actorLogin,
    artifacts: options.artifactNames,
    baseCommit: options.baseCommit,
    candidateRef: options.candidateRef,
    cliArgs: options.cliArgs,
    conclusion: options.conclusion,
    ...(options.error === undefined ? {} : { error: options.error }),
    issueNumber: options.issueNumber,
    measure: options.measure,
    requestId: options.requestId,
    sourceRepository: options.sourceRepository,
    statusCommentId: options.statusCommentId,
    stepOutcomes: options.stepOutcomes,
    workflowRun: options.workflowRun,
  }
}

const parseJson = <T>(value: string): T => {
  return JSON.parse(value) as T
}

const parseCliArgs = (value: string | undefined): readonly string[] => {
  if (!value) {
    return []
  }
  return value.split(/\s+/).filter(Boolean)
}

const isEntryPoint = process.argv[1] === new URL(import.meta.url).pathname

if (isEntryPoint) {
  const outputPath = process.argv[2]
  if (!outputPath) {
    throw new Error('Expected output path as the first argument')
  }
  const payload = createMeasureWorkflowSummary({
    actorLogin: process.env.MEASURE_ACTOR_LOGIN || '',
    artifactNames: parseJson(process.env.MEASURE_ARTIFACT_NAMES || '{}'),
    baseCommit: process.env.MEASURE_BASE_COMMIT || '',
    candidateRef: process.env.MEASURE_CANDIDATE_REF || '',
    cliArgs: parseCliArgs(process.env.MEASURE_CLI_ARGS),
    conclusion: (process.env.MEASURE_CONCLUSION || 'failure') as 'success' | 'failure',
    ...(process.env.MEASURE_ERROR_JSON ? { error: parseJson(process.env.MEASURE_ERROR_JSON) } : {}),
    issueNumber: Number.parseInt(process.env.MEASURE_ISSUE_NUMBER || '0', 10),
    measure: process.env.MEASURE_NAME || '',
    requestId: process.env.MEASURE_REQUEST_ID || '',
    sourceRepository: {
      owner: process.env.MEASURE_SOURCE_OWNER || '',
      repo: process.env.MEASURE_SOURCE_REPO || '',
    },
    statusCommentId: Number.parseInt(process.env.MEASURE_STATUS_COMMENT_ID || '0', 10),
    stepOutcomes: parseJson(process.env.MEASURE_STEP_OUTCOMES || '{}'),
    workflowRun: {
      id: Number.parseInt(process.env.MEASURE_WORKFLOW_RUN_ID || '0', 10),
      url: process.env.MEASURE_WORKFLOW_RUN_URL || '',
    },
  })
  const { writeFileSync } = await import('node:fs')
  writeFileSync(outputPath, JSON.stringify(payload, null, 2))
}
