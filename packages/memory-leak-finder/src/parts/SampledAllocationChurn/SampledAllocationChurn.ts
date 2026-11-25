import type { Dynamic } from '../Types/Types.ts'

export interface SampledAllocationChurnMetrics {
  readonly callFrameCount: number
  readonly sampleCount: number
  readonly sampledAllocatedBytes: number
}

export interface SampledAllocationChurnFrame {
  readonly columnNumber: number
  readonly functionName: string
  readonly lineNumber: number
  readonly scriptId: string
  readonly selfBytes: number
  readonly url: string
}

export interface SampledAllocationChurnStack {
  readonly selfBytes: number
  readonly stack: readonly string[]
}

export interface SampledAllocationChurnSummary {
  readonly metrics: SampledAllocationChurnMetrics
  readonly samplingIntervalBytes: number
  readonly supported: boolean
  readonly topSelfBytes: readonly SampledAllocationChurnFrame[]
  readonly topStacks: readonly SampledAllocationChurnStack[]
  readonly unsupportedReason: string
}

export interface SampledAllocationChurnResult extends SampledAllocationChurnSummary {
  readonly isLeak: false
}

interface MutableFrame {
  columnNumber: number
  functionName: string
  lineNumber: number
  scriptId: string
  selfBytes: number
  url: string
}

interface PendingNode {
  readonly node: Dynamic
  readonly stack: readonly string[]
}

export const MaxTopSelfBytes = 50
export const MaxTopStacks = 20
export const MaxStackDepth = 16
const MaxSummaryRows = 10
const AnonymousFunction = '(anonymous)'

const toArray = (value: Dynamic): readonly Dynamic[] => {
  return Array.isArray(value) ? value : []
}

const toBytes = (value: Dynamic): number => {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0
}

const toInteger = (value: Dynamic): number => {
  return typeof value === 'number' && Number.isInteger(value) ? value : -1
}

const toString = (value: Dynamic): string => {
  return typeof value === 'string' ? value : ''
}

const isRecord = (value: Dynamic): boolean => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const formatPosition = (lineNumber: number, columnNumber: number): string => {
  if (lineNumber < 0) {
    return ''
  }
  // CDP positions are zero-based; stack strings use one-based positions like JavaScript stack traces.
  return columnNumber < 0 ? `:${lineNumber + 1}` : `:${lineNumber + 1}:${columnNumber + 1}`
}

const formatFrame = (frame: Omit<MutableFrame, 'selfBytes'>): string => {
  const functionName = frame.functionName || AnonymousFunction
  if (!frame.url) {
    return functionName
  }
  return `${functionName} (${frame.url}${formatPosition(frame.lineNumber, frame.columnNumber)})`
}

const toFrame = (callFrame: Dynamic): Omit<MutableFrame, 'selfBytes'> => {
  const value = isRecord(callFrame) ? callFrame : {}
  return {
    columnNumber: toInteger(value.columnNumber),
    functionName: toString(value.functionName),
    lineNumber: toInteger(value.lineNumber),
    scriptId: String(value.scriptId ?? ''),
    url: toString(value.url),
  }
}

const getFrameKey = (frame: Omit<MutableFrame, 'selfBytes'>): string => {
  return JSON.stringify([frame.functionName, frame.url, frame.scriptId, frame.lineNumber, frame.columnNumber])
}

const compareFrames = (a: SampledAllocationChurnFrame, b: SampledAllocationChurnFrame): number => {
  return (
    b.selfBytes - a.selfBytes ||
    a.url.localeCompare(b.url) ||
    a.lineNumber - b.lineNumber ||
    a.columnNumber - b.columnNumber ||
    a.functionName.localeCompare(b.functionName)
  )
}

const compareStacks = (a: SampledAllocationChurnStack, b: SampledAllocationChurnStack): number => {
  return b.selfBytes - a.selfBytes || a.stack.join('\n').localeCompare(b.stack.join('\n'))
}

/**
 * Aggregates a `HeapProfiler.getSamplingProfile` profile. `selfSize` values are V8's Poisson-scaled estimates of the
 * bytes allocated at each node during the sampling window. The root node is not a call frame and is skipped.
 */
export const getSampledAllocationChurnSummary = (
  profile: Dynamic,
  samplingIntervalBytes: number,
  supported = true,
  unsupportedReason = '',
): SampledAllocationChurnSummary => {
  const frames = new Map<string, MutableFrame>()
  const stacks = new Map<string, { selfBytes: number; stack: readonly string[] }>()
  let sampledAllocatedBytes = 0
  const head = profile?.head
  const pending: PendingNode[] = isRecord(head) ? toArray(head.children).map((node) => ({ node, stack: [] })) : []
  if (isRecord(head)) {
    sampledAllocatedBytes += toBytes(head.selfSize)
  }
  while (pending.length > 0) {
    const { node, stack: parentStack } = pending.pop() as PendingNode
    if (!isRecord(node)) {
      continue
    }
    const frame = toFrame(node.callFrame)
    const stack = [formatFrame(frame), ...parentStack].slice(0, MaxStackDepth)
    const selfBytes = toBytes(node.selfSize)
    if (selfBytes > 0) {
      sampledAllocatedBytes += selfBytes
      const frameKey = getFrameKey(frame)
      const frameRow = frames.get(frameKey) || { ...frame, selfBytes: 0 }
      frameRow.selfBytes += selfBytes
      frames.set(frameKey, frameRow)
      const stackKey = JSON.stringify(stack)
      const stackRow = stacks.get(stackKey) || { selfBytes: 0, stack }
      stackRow.selfBytes += selfBytes
      stacks.set(stackKey, stackRow)
    }
    for (const child of toArray(node.children)) {
      pending.push({ node: child, stack })
    }
  }
  return {
    metrics: {
      callFrameCount: frames.size,
      sampleCount: toArray(profile?.samples).length,
      sampledAllocatedBytes,
    },
    samplingIntervalBytes,
    supported,
    topSelfBytes: [...frames.values()].toSorted(compareFrames).slice(0, MaxTopSelfBytes),
    topStacks: [...stacks.values()].toSorted(compareStacks).slice(0, MaxTopStacks),
    unsupportedReason,
  }
}

export const getSampledProfileBytes = (profile: Dynamic): number => {
  return getSampledAllocationChurnSummary(profile, 0).metrics.sampledAllocatedBytes
}

const formatLocation = (row: SampledAllocationChurnFrame): string => {
  if (!row.url) {
    return ''
  }
  return `${row.url}${formatPosition(row.lineNumber, row.columnNumber)}`
}

export const formatSampledAllocationChurnSummary = ({
  metrics,
  samplingIntervalBytes,
  supported,
  topSelfBytes,
  unsupportedReason,
}: SampledAllocationChurnSummary): string => {
  const lines = [
    'Sampled allocation churn (statistical estimate, includes collected objects):',
    `supported | ${supported}`,
    `samplingIntervalBytes | ${samplingIntervalBytes}`,
    `sampledAllocatedBytes | ${metrics.sampledAllocatedBytes}`,
    `sampleCount | ${metrics.sampleCount}`,
    `callFrameCount | ${metrics.callFrameCount}`,
  ]
  if (!supported && unsupportedReason) {
    lines.push(`unsupportedReason | ${unsupportedReason}`)
  }
  if (topSelfBytes.length > 0) {
    lines.push('top allocating functions:')
    lines.push('selfBytes | function | location')
    for (const row of topSelfBytes.slice(0, MaxSummaryRows)) {
      lines.push(`${Math.round(row.selfBytes)} | ${row.functionName || AnonymousFunction} | ${formatLocation(row)}`)
    }
  }
  return lines.join('\n')
}
