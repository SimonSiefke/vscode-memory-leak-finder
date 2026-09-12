import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractMessages, type IpcMessage } from './analyzeIpcMessagesFromStart.ts'

type Dynamic = unknown

type Endpoint = {
  readonly kind?: string
  readonly label?: string
  readonly pid?: number
  readonly webContentsId?: number
}

type CapturedIpcMessage = IpcMessage & {
  readonly direction?: string
  readonly from?: Endpoint
  readonly to?: Endpoint
}

type MessageRow = {
  readonly fingerprint: string
  readonly index: number
  readonly message: CapturedIpcMessage
  readonly payloadBytes: number
  readonly timestamp: number
}

type MessageRole = 'request' | 'response' | 'subscription' | 'event' | 'control' | 'other'

export type OperationSummary = {
  readonly operation: string
  readonly messages: number
  readonly requests: number
  readonly responses: number
  readonly subscriptions: number
  readonly events: number
  readonly controls: number
  readonly payloadBytes: number
  readonly maxPayloadBytes: number
}

export type RepeatedRequestSummary = {
  readonly operation: string
  readonly count: number
  readonly payloadBytes: number
  readonly sample: string
}

export type PatternMessageSummary = {
  readonly index: number
  readonly timestamp: number
  readonly type: string
  readonly operation: string
  readonly payloadBytes: number
  readonly sample: string
}

export type BufferWasteSummary = {
  readonly operation: string
  readonly responses: number
  readonly allocatedBytes: number
  readonly usedBytes: number
  readonly wastedBytes: number
  readonly wastedPercentage: number
}

export type ScenarioSummary = {
  readonly scenario: string
  readonly inputPath: string
  readonly durationMs: number
  readonly rawMessages: number
  readonly rawPayloadBytes: number
  readonly duplicateCandidateMessages: number
  readonly duplicateCandidatePayloadBytes: number
  readonly logicalMessages: number
  readonly logicalPayloadBytes: number
  readonly protocolCalls: number
  readonly protocolSubscriptions: number
  readonly bufferWaste: readonly BufferWasteSummary[]
  readonly operations: readonly OperationSummary[]
  readonly repeatedRequests: readonly RepeatedRequestSummary[]
  readonly largestMessages: readonly PatternMessageSummary[]
}

export type BaselineComparison = {
  readonly scenario: string
  readonly commonPrefixMessages: number
  readonly logicalMessageDelta: number
  readonly logicalPayloadByteDelta: number
}

export type ScenarioIncrement = {
  readonly previousScenario: string
  readonly scenario: string
  readonly commonPrefixMessages: number
  readonly logicalMessageDelta: number
  readonly logicalPayloadByteDelta: number
  readonly durationDeltaMs: number
}

export type DirectoryAnalysis = {
  readonly inputDirectory: string
  readonly duplicateWindowMs: number
  readonly baselineScenario: string
  readonly scenarios: readonly ScenarioSummary[]
  readonly comparisons: readonly BaselineComparison[]
  readonly increments: readonly ScenarioIncrement[]
}

type ScenarioAnalysis = {
  readonly summary: ScenarioSummary
  readonly fingerprints: readonly string[]
}

type OperationData = {
  messages: number
  requests: number
  responses: number
  subscriptions: number
  events: number
  controls: number
  payloadBytes: number
  maxPayloadBytes: number
}

type BufferWasteData = {
  responses: number
  allocatedBytes: number
  usedBytes: number
}

type CliOptions = {
  readonly inputDirectory: string
  readonly jsonPath: string
  readonly top: number
  readonly duplicateWindowMs: number
}

const defaultInputDirectory = '.vscode-memory-leak-finder-results/node/ipc-messages-from-start'
const defaultJsonPath = '.tmp/ipc-message-patterns.json'
const defaultTop = 30
const defaultDuplicateWindowMs = 10
const root = join(import.meta.dirname, '../../..')

const stringify = (value: Dynamic): string => {
  return JSON.stringify(value) ?? ''
}

const sensitiveKeyPattern = /(authorization|cookie|credential|password|secret|token|api[_-]?key|access[_-]?key)/i

const stringifySample = (value: Dynamic): string => {
  return (
    JSON.stringify(value, (key, nestedValue) => {
      return key && sensitiveKeyPattern.test(key) ? '[redacted]' : nestedValue
    }) ?? ''
  )
}

const hash = (value: string): string => {
  return createHash('sha256').update(value).digest('hex')
}

const truncate = (value: string, maxLength = 240): string => {
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength - 1)}…`
}

const getPayload = (message: CapturedIpcMessage): Dynamic => {
  if (message.args !== undefined) {
    return message.args
  }
  if (message.result !== undefined) {
    return message.result
  }
  return message
}

const getEndpointIdentity = (endpoint: Endpoint | undefined): Dynamic => {
  if (!endpoint) {
    return undefined
  }
  return {
    kind: endpoint.kind,
    label: endpoint.label,
    pid: endpoint.pid,
    webContentsId: endpoint.webContentsId,
  }
}

const createMessageRow = (message: CapturedIpcMessage, index: number): MessageRow => {
  const payload = getPayload(message)
  const payloadSerialized = stringify(payload)
  const fingerprint = hash(
    stringify({
      channel: message.channel,
      direction: message.direction,
      from: getEndpointIdentity(message.from),
      payload,
      to: getEndpointIdentity(message.to),
      type: message.type,
    }),
  )
  return {
    fingerprint,
    index,
    message,
    payloadBytes: Buffer.byteLength(payloadSerialized),
    timestamp: typeof message.timestamp === 'number' ? message.timestamp : index,
  }
}

export const collapseDuplicateCandidates = (
  messages: readonly CapturedIpcMessage[],
  duplicateWindowMs = defaultDuplicateWindowMs,
): {
  readonly rows: readonly MessageRow[]
  readonly duplicateMessages: number
  readonly duplicatePayloadBytes: number
  readonly rawPayloadBytes: number
} => {
  const rows: MessageRow[] = []
  const lastTimestampByFingerprint = new Map<string, number>()
  let duplicateMessages = 0
  let duplicatePayloadBytes = 0
  let rawPayloadBytes = 0

  for (const [index, message] of messages.entries()) {
    const row = createMessageRow(message, index)
    rawPayloadBytes += row.payloadBytes
    const lastTimestamp = lastTimestampByFingerprint.get(row.fingerprint)
    if (lastTimestamp !== undefined && row.timestamp - lastTimestamp >= 0 && row.timestamp - lastTimestamp <= duplicateWindowMs) {
      duplicateMessages++
      duplicatePayloadBytes += row.payloadBytes
    } else {
      rows.push(row)
    }
    lastTimestampByFingerprint.set(row.fingerprint, row.timestamp)
  }

  return {
    rows,
    duplicateMessages,
    duplicatePayloadBytes,
    rawPayloadBytes,
  }
}

const getProtocolFrame = (message: CapturedIpcMessage): readonly Dynamic[] | undefined => {
  const firstArg = message.args?.[0]
  if (!Array.isArray(firstArg) || typeof firstArg[0] !== 'number') {
    return undefined
  }
  return firstArg
}

const addOperation = (operations: Map<string, OperationData>, operation: string, role: MessageRole, payloadBytes: number): void => {
  const current = operations.get(operation) || {
    messages: 0,
    requests: 0,
    responses: 0,
    subscriptions: 0,
    events: 0,
    controls: 0,
    payloadBytes: 0,
    maxPayloadBytes: 0,
  }
  current.messages++
  current.payloadBytes += payloadBytes
  current.maxPayloadBytes = Math.max(current.maxPayloadBytes, payloadBytes)
  if (role === 'request') {
    current.requests++
  } else if (role === 'response') {
    current.responses++
  } else if (role === 'subscription') {
    current.subscriptions++
  } else if (role === 'event') {
    current.events++
  } else if (role === 'control') {
    current.controls++
  }
  operations.set(operation, current)
}

const getOperation = (
  message: CapturedIpcMessage,
  frame: readonly Dynamic[] | undefined,
  requests: Map<number, string>,
  subscriptions: Map<number, string>,
): { readonly operation: string; readonly role: MessageRole } => {
  if (!frame) {
    return {
      operation: `electron:${message.channel || message.type || 'unknown'}`,
      role: 'other',
    }
  }

  const protocolType = frame[0]
  const id = frame[1]
  if (protocolType === 100 && typeof id === 'number' && typeof frame[2] === 'string' && typeof frame[3] === 'string') {
    const operation = `call ${frame[2]}.${frame[3]}`
    requests.set(id, operation)
    return { operation, role: 'request' }
  }
  if (protocolType === 102 && typeof id === 'number' && typeof frame[2] === 'string' && typeof frame[3] === 'string') {
    const operation = `event ${frame[2]}.${frame[3]}`
    subscriptions.set(id, operation)
    return { operation, role: 'subscription' }
  }
  if ((protocolType === 201 || protocolType === 202 || protocolType === 203) && typeof id === 'number') {
    return {
      operation: requests.get(id) || `response ${protocolType}`,
      role: 'response',
    }
  }
  if (protocolType === 204 && typeof id === 'number') {
    return {
      operation: subscriptions.get(id) || 'event unknown',
      role: 'event',
    }
  }
  if ((protocolType === 101 || protocolType === 103) && typeof id === 'number') {
    return {
      operation: requests.get(id) || subscriptions.get(id) || `control ${protocolType}`,
      role: 'control',
    }
  }
  return {
    operation: `protocol ${String(protocolType)}`,
    role: 'other',
  }
}

const getRequestFingerprint = (frame: readonly Dynamic[]): string => {
  return hash(stringify([frame[0], frame[2], frame[3], frame[4]]))
}

const getBufferRead = (frame: readonly Dynamic[]): { readonly allocatedBytes: number; readonly usedBytes: number } | undefined => {
  if (frame[0] !== 201 || !Array.isArray(frame[2])) {
    return undefined
  }
  const [buffer, bytesRead] = frame[2]
  if (
    typeof bytesRead !== 'number' ||
    typeof buffer !== 'object' ||
    !buffer ||
    !('data' in buffer) ||
    !Array.isArray((buffer as { readonly data?: Dynamic }).data)
  ) {
    return undefined
  }
  const allocatedBytes = (buffer as { readonly data: readonly Dynamic[] }).data.length
  return {
    allocatedBytes,
    usedBytes: Math.min(Math.max(bytesRead, 0), allocatedBytes),
  }
}

const getCommonPrefixLength = (a: readonly string[], b: readonly string[]): number => {
  const max = Math.min(a.length, b.length)
  let index = 0
  while (index < max && a[index] === b[index]) {
    index++
  }
  return index
}

export const analyzeScenario = (
  scenario: string,
  inputPath: string,
  messages: readonly CapturedIpcMessage[],
  top = defaultTop,
  duplicateWindowMs = defaultDuplicateWindowMs,
): ScenarioAnalysis => {
  const collapsed = collapseDuplicateCandidates(messages, duplicateWindowMs)
  const requests = new Map<number, string>()
  const subscriptions = new Map<number, string>()
  const operations = new Map<string, OperationData>()
  const bufferWaste = new Map<string, BufferWasteData>()
  const bufferResponseIds = new Set<number>()
  const repeatedRequests = new Map<string, { operation: string; count: number; payloadBytes: number; sample: string }>()
  const largestMessages: PatternMessageSummary[] = []
  let protocolCalls = 0
  let protocolSubscriptions = 0
  let logicalPayloadBytes = 0

  for (const row of collapsed.rows) {
    const frame = getProtocolFrame(row.message)
    const { operation, role } = getOperation(row.message, frame, requests, subscriptions)
    logicalPayloadBytes += row.payloadBytes
    addOperation(operations, operation, role, row.payloadBytes)
    if (frame && typeof frame[1] === 'number' && !bufferResponseIds.has(frame[1])) {
      const bufferRead = getBufferRead(frame)
      if (bufferRead) {
        bufferResponseIds.add(frame[1])
        const current = bufferWaste.get(operation) || { responses: 0, allocatedBytes: 0, usedBytes: 0 }
        current.responses++
        current.allocatedBytes += bufferRead.allocatedBytes
        current.usedBytes += bufferRead.usedBytes
        bufferWaste.set(operation, current)
      }
    }
    if (role === 'request' && frame) {
      protocolCalls++
      const requestFingerprint = getRequestFingerprint(frame)
      const current = repeatedRequests.get(requestFingerprint)
      if (current) {
        current.count++
        current.payloadBytes += row.payloadBytes
      } else {
        repeatedRequests.set(requestFingerprint, {
          operation,
          count: 1,
          payloadBytes: row.payloadBytes,
          sample: truncate(stringifySample(frame[4])),
        })
      }
    } else if (role === 'subscription') {
      protocolSubscriptions++
    }
    largestMessages.push({
      index: row.index,
      timestamp: row.timestamp,
      type: row.message.type || '',
      operation,
      payloadBytes: row.payloadBytes,
      sample: truncate(stringifySample(getPayload(row.message))),
    })
  }

  const timestamps = collapsed.rows.map((row) => row.timestamp)
  const operationSummaries = [...operations.entries()]
    .map(([operation, data]) => ({ operation, ...data }))
    .sort((a, b) => b.payloadBytes - a.payloadBytes || b.messages - a.messages || a.operation.localeCompare(b.operation))
    .slice(0, top)
  const repeatedRequestSummaries = [...repeatedRequests.values()]
    .filter((item) => item.count > 1)
    .sort((a, b) => b.count - a.count || b.payloadBytes - a.payloadBytes || a.operation.localeCompare(b.operation))
    .slice(0, top)

  return {
    summary: {
      scenario,
      inputPath,
      durationMs: timestamps.length > 1 ? Math.max(...timestamps) - Math.min(...timestamps) : 0,
      rawMessages: messages.length,
      rawPayloadBytes: collapsed.rawPayloadBytes,
      duplicateCandidateMessages: collapsed.duplicateMessages,
      duplicateCandidatePayloadBytes: collapsed.duplicatePayloadBytes,
      logicalMessages: collapsed.rows.length,
      logicalPayloadBytes,
      protocolCalls,
      protocolSubscriptions,
      bufferWaste: [...bufferWaste.entries()]
        .map(([operation, data]) => {
          const wastedBytes = data.allocatedBytes - data.usedBytes
          return {
            operation,
            ...data,
            wastedBytes,
            wastedPercentage: data.allocatedBytes === 0 ? 0 : Number(((wastedBytes / data.allocatedBytes) * 100).toFixed(2)),
          }
        })
        .sort((a, b) => b.wastedBytes - a.wastedBytes || a.operation.localeCompare(b.operation))
        .slice(0, top),
      operations: operationSummaries,
      repeatedRequests: repeatedRequestSummaries,
      largestMessages: largestMessages.sort((a, b) => b.payloadBytes - a.payloadBytes || a.index - b.index).slice(0, top),
    },
    fingerprints: collapsed.rows.map((row) => row.fingerprint),
  }
}

const analyzeFile = async (inputPath: string, top: number, duplicateWindowMs: number): Promise<ScenarioAnalysis> => {
  const parsed = JSON.parse(await readFile(inputPath, 'utf8')) as Dynamic
  const scenario = basename(inputPath, extname(inputPath))
  return analyzeScenario(scenario, inputPath, extractMessages(parsed), top, duplicateWindowMs)
}

export const analyzeDirectory = async (
  inputDirectory: string,
  top = defaultTop,
  duplicateWindowMs = defaultDuplicateWindowMs,
): Promise<DirectoryAnalysis> => {
  const names = (await readdir(inputDirectory)).filter((name) => name.endsWith('.json')).sort()
  if (names.length === 0) {
    throw new Error(`No JSON files found in ${inputDirectory}`)
  }
  const analyses: ScenarioAnalysis[] = []
  for (const name of names) {
    analyses.push(await analyzeFile(join(inputDirectory, name), top, duplicateWindowMs))
  }
  const baseline = analyses.find((analysis) => analysis.summary.scenario === 'base') || analyses[0]
  const chronological = [...analyses].sort((a, b) => {
    if (a === baseline) {
      return -1
    }
    if (b === baseline) {
      return 1
    }
    return a.summary.durationMs - b.summary.durationMs || a.summary.scenario.localeCompare(b.summary.scenario)
  })
  const increments = chronological.slice(1).map((analysis, index) => {
    const previous = chronological[index]
    return {
      previousScenario: previous.summary.scenario,
      scenario: analysis.summary.scenario,
      commonPrefixMessages: getCommonPrefixLength(previous.fingerprints, analysis.fingerprints),
      logicalMessageDelta: analysis.summary.logicalMessages - previous.summary.logicalMessages,
      logicalPayloadByteDelta: analysis.summary.logicalPayloadBytes - previous.summary.logicalPayloadBytes,
      durationDeltaMs: analysis.summary.durationMs - previous.summary.durationMs,
    }
  })
  return {
    inputDirectory,
    duplicateWindowMs,
    baselineScenario: baseline.summary.scenario,
    scenarios: analyses.map((analysis) => analysis.summary),
    comparisons: analyses
      .filter((analysis) => analysis !== baseline)
      .map((analysis) => ({
        scenario: analysis.summary.scenario,
        commonPrefixMessages: getCommonPrefixLength(baseline.fingerprints, analysis.fingerprints),
        logicalMessageDelta: analysis.summary.logicalMessages - baseline.summary.logicalMessages,
        logicalPayloadByteDelta: analysis.summary.logicalPayloadBytes - baseline.summary.logicalPayloadBytes,
      }))
      .sort((a, b) => b.logicalPayloadByteDelta - a.logicalPayloadByteDelta || a.scenario.localeCompare(b.scenario)),
    increments,
  }
}

const readFlagValue = (args: readonly string[], index: number, flag: string): string => {
  const value = args[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${flag}`)
  }
  return value
}

const parsePositiveInteger = (value: string, flag: string): number => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer`)
  }
  return parsed
}

export const parseCliArgs = (args: readonly string[]): CliOptions => {
  let inputDirectory = defaultInputDirectory
  let jsonPath = defaultJsonPath
  let top = defaultTop
  let duplicateWindowMs = defaultDuplicateWindowMs
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === '--input') {
      inputDirectory = readFlagValue(args, index, arg)
      index++
    } else if (arg === '--json') {
      jsonPath = readFlagValue(args, index, arg)
      index++
    } else if (arg === '--top') {
      top = parsePositiveInteger(readFlagValue(args, index, arg), arg)
      index++
    } else if (arg === '--duplicate-window-ms') {
      duplicateWindowMs = parsePositiveInteger(readFlagValue(args, index, arg), arg)
      index++
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  return { inputDirectory, jsonPath, top, duplicateWindowMs }
}

const resolveFromRoot = (path: string): string => {
  return path.startsWith('.') ? resolve(root, path) : resolve(path)
}

export const runCli = async (args: readonly string[], logger: Pick<Console, 'log'> = console): Promise<void> => {
  const options = parseCliArgs(args)
  const inputDirectory = resolveFromRoot(options.inputDirectory)
  const jsonPath = resolveFromRoot(options.jsonPath)
  const analysis = await analyzeDirectory(inputDirectory, options.top, options.duplicateWindowMs)
  await mkdir(dirname(jsonPath), { recursive: true })
  await writeFile(jsonPath, `${JSON.stringify(analysis, null, 2)}\n`)
  logger.log(`Analyzed ${analysis.scenarios.length} IPC scenarios`)
  for (const scenario of analysis.scenarios) {
    logger.log(
      `${scenario.scenario}: ${scenario.rawMessages} raw, ${scenario.logicalMessages} after collapsing ${scenario.duplicateCandidateMessages} duplicate candidates, ${scenario.protocolCalls} calls`,
    )
  }
  logger.log(`Wrote ${jsonPath}`)
}

const main = async (): Promise<void> => {
  try {
    await runCli(process.argv.slice(2))
  } catch (error) {
    console.error((error as Error).message)
    process.exit(1)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
