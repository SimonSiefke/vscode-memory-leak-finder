export type CreateMeasureWorkflowSummaryOptions = {
  readonly actorLogin: string
  readonly artifactNames: {
    readonly baseCharts?: string
    readonly baseLogs?: string
    readonly baseResults?: string
    readonly baseVideo?: string
    readonly candidateCharts?: string
    readonly candidateLogs?: string
    readonly candidateResults?: string
    readonly candidateVideo?: string
    readonly summary: string
  }
  readonly chartPaths?: {
    readonly base?: string
    readonly candidate?: string
  }
  readonly baseCommit: string
  readonly candidateRef: string
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

type NamedFunctionCountItem = {
  readonly count?: number
  readonly name?: string
  readonly originalLocation?: string
  readonly originalName?: string
  readonly sourceLocation?: string
}

export const createMeasureWorkflowSummary = (options: CreateMeasureWorkflowSummaryOptions) => {
  return {
    actorLogin: options.actorLogin,
    artifacts: options.artifactNames,
    baseCommit: options.baseCommit,
    candidateRef: options.candidateRef,
    ...(options.chartPaths === undefined ? {} : { chartPaths: options.chartPaths }),
    cliArgs: options.cliArgs,
    conclusion: options.conclusion,
    ...(options.error === undefined ? {} : { error: options.error }),
    ...(options.fixedFunctionNames === undefined ? {} : { fixedFunctionNames: options.fixedFunctionNames }),
    issueNumber: options.issueNumber,
    measure: options.measure,
    requestId: options.requestId,
    sourceRepository: options.sourceRepository,
    statusCommentId: options.statusCommentId,
    stepOutcomes: options.stepOutcomes,
    workflowRun: options.workflowRun,
  }
}

const tscErrorLineRegex = /^\[\d{2}:\d{2}:\d{2}\] Error: /
const tscCompilationSummaryLineRegex = /^\[\d{2}:\d{2}:\d{2}\] Finished compilation with \d+ errors after \d+ ms$/

export const extractTscErrorLines = (log: string): readonly string[] => {
  return log
    .split('\n')
    .map((line) => line.replace(/\r$/, ''))
    .filter((line) => tscErrorLineRegex.test(line) || tscCompilationSummaryLineRegex.test(line))
}

const readFileIfExists = async (filePath: string): Promise<string> => {
  if (!filePath) {
    return ''
  }
  try {
    const { readFile } = await import('node:fs/promises')
    return await readFile(filePath, 'utf8')
  } catch {
    return ''
  }
}

const getTscErrorLinesFromLogPaths = async (logPaths: readonly string[]): Promise<readonly string[]> => {
  const contents = await Promise.all(logPaths.map(readFileIfExists))
  return contents.flatMap(extractTscErrorLines)
}

const mergeErrorWithTscErrorLines = (error: unknown, tscErrorLines: readonly string[]): unknown => {
  if (tscErrorLines.length === 0) {
    return error
  }
  if (error === undefined) {
    return {
      tscErrorLines,
    }
  }
  if (typeof error === 'object' && error && !Array.isArray(error)) {
    return {
      ...error,
      tscErrorLines,
    }
  }
  return {
    error,
    tscErrorLines,
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

const getChartRelativeSegments = (chartPath: string): readonly string[] => {
  const segments = chartPath.split('/').filter(Boolean)
  if (segments[0] === 'base-charts' || segments[0] === 'candidate-charts') {
    return segments.slice(1)
  }
  return segments
}

const getResultsJsonPath = async (resultsPath: string, chartPath: string, measure: string): Promise<string> => {
  const { join } = await import('node:path')
  const segments = getChartRelativeSegments(chartPath)
  const chartFileName = segments.at(-1)
  if (!chartFileName) {
    return ''
  }
  const resultFileName = chartFileName.replace(/\.svg$/, '.json')
  if (segments.length >= 3) {
    return join(resultsPath, segments[0], measure, resultFileName)
  }
  return join(resultsPath, measure, resultFileName)
}

const getFunctionDisplayName = (item: NamedFunctionCountItem): string => {
  return item.originalName || item.name || item.originalLocation || item.sourceLocation || ''
}

const getUniqueName = (usedNames: Set<string>, currentName: string): string => {
  let uniqueName = currentName
  let counter = 2

  while (usedNames.has(uniqueName)) {
    uniqueName = `${currentName} (${counter})`
    counter++
  }

  return uniqueName
}

const readNamedFunctionCountItems = async (filePath: string): Promise<readonly NamedFunctionCountItem[]> => {
  if (!filePath) {
    return []
  }
  try {
    const { readFile } = await import('node:fs/promises')
    const content = await readFile(filePath, 'utf8')
    const parsed = JSON.parse(content) as { readonly namedFunctionCount3?: readonly NamedFunctionCountItem[] }
    return parsed.namedFunctionCount3 || []
  } catch {
    return []
  }
}

const getUniqueFunctionRows = (items: readonly NamedFunctionCountItem[]): { readonly count: number; readonly name: string }[] => {
  const usedNames = new Set<string>()
  const rows: { readonly count: number; readonly name: string }[] = []
  for (const item of items) {
    const displayName = getFunctionDisplayName(item)
    if (!displayName) {
      continue
    }
    const uniqueName = getUniqueName(usedNames, displayName)
    usedNames.add(uniqueName)
    rows.push({
      count: item.count || 0,
      name: uniqueName,
    })
  }
  rows.sort((a, b) => b.count - a.count)
  return rows
}

export const getFixedFunctionNamesFromItems = (
  baseItems: readonly NamedFunctionCountItem[],
  candidateItems: readonly NamedFunctionCountItem[],
): readonly string[] | undefined => {
  if (baseItems.length === 0) {
    return undefined
  }
  const baseRows = getUniqueFunctionRows(baseItems)
  const candidateRows = getUniqueFunctionRows(candidateItems)
  const candidateNames = new Set(candidateRows.map((item) => item.name))
  const names = baseRows.filter((item) => !candidateNames.has(item.name)).map((item) => item.name)
  return names.length === 0 ? undefined : names
}

const getFixedFunctionNames = async ({
  baseResultsPath,
  candidateResultsPath,
  chartPaths,
  measure,
}: {
  readonly baseResultsPath: string | undefined
  readonly candidateResultsPath: string | undefined
  readonly chartPaths: { readonly base?: string; readonly candidate?: string } | undefined
  readonly measure: string
}): Promise<readonly string[] | undefined> => {
  if (!baseResultsPath || !candidateResultsPath || !chartPaths?.base || measure !== 'named-function-count3') {
    return undefined
  }
  const [baseJsonPath, candidateJsonPath] = await Promise.all([
    getResultsJsonPath(baseResultsPath, chartPaths.base, measure),
    chartPaths.candidate ? getResultsJsonPath(candidateResultsPath, chartPaths.candidate, measure) : '',
  ])
  const [baseItems, candidateItems] = await Promise.all([
    readNamedFunctionCountItems(baseJsonPath),
    readNamedFunctionCountItems(candidateJsonPath),
  ])
  return getFixedFunctionNamesFromItems(baseItems, candidateItems)
}

const isEntryPoint = process.argv[1] === new URL(import.meta.url).pathname

if (isEntryPoint) {
  const outputPath = process.argv[2]
  if (!outputPath) {
    throw new Error('Expected output path as the first argument')
  }
  const chartPaths = process.env.MEASURE_CHART_PATHS
    ? parseJson<{ readonly base?: string; readonly candidate?: string }>(process.env.MEASURE_CHART_PATHS)
    : undefined
  const fixedFunctionNames = await getFixedFunctionNames({
    baseResultsPath: process.env.MEASURE_BASE_RESULTS_PATH,
    candidateResultsPath: process.env.MEASURE_CANDIDATE_RESULTS_PATH,
    chartPaths,
    measure: process.env.MEASURE_NAME || '',
  })
  const rawError = process.env.MEASURE_ERROR_JSON ? parseJson(process.env.MEASURE_ERROR_JSON) : undefined
  const tscErrorLines = await getTscErrorLinesFromLogPaths([
    process.env.MEASURE_BASE_LOG_PATH || '',
    process.env.MEASURE_CANDIDATE_LOG_PATH || '',
  ])
  const error = mergeErrorWithTscErrorLines(rawError, tscErrorLines)
  const payload = createMeasureWorkflowSummary({
    actorLogin: process.env.MEASURE_ACTOR_LOGIN || '',
    artifactNames: parseJson(process.env.MEASURE_ARTIFACT_NAMES || '{}'),
    baseCommit: process.env.MEASURE_BASE_COMMIT || '',
    candidateRef: process.env.MEASURE_CANDIDATE_REF || '',
    ...(chartPaths ? { chartPaths } : {}),
    cliArgs: parseCliArgs(process.env.MEASURE_CLI_ARGS),
    conclusion: (process.env.MEASURE_CONCLUSION || 'failure') as 'success' | 'failure',
    ...(error === undefined ? {} : { error }),
    ...(fixedFunctionNames ? { fixedFunctionNames } : {}),
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
