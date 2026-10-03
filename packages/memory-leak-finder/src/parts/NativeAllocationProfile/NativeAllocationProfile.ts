import type { Dynamic } from '../Types/Types.ts'

export interface NativeAllocationProfileMetrics {
  readonly attributedAllocationBytes: number
  readonly moduleCount: number
  readonly sampleCount: number
  readonly sampledBytes: number
}

export interface NativeAllocationProfileModule {
  readonly baseAddress: string
  readonly name: string
  readonly size: number
  readonly uuid: string
}

export interface NativeAllocationProfileStack {
  readonly attributedAllocationBytes: number
  readonly sampledBytes: number
  readonly stack: readonly string[]
}

export interface NativeAllocationProfileDisplay {
  readonly metrics: NativeAllocationProfileMetrics
  readonly supported: boolean
  readonly topStacks: readonly NativeAllocationProfileStack[]
  readonly unsupportedReason: string
}

export interface NativeAllocationProfileResult extends NativeAllocationProfileDisplay {
  readonly isLeak: false
  readonly modules: readonly NativeAllocationProfileModule[]
  readonly raw: {
    readonly after: Dynamic
    readonly before: Dynamic
  }
}

export interface NativeAllocationProfileSummary extends NativeAllocationProfileDisplay {
  readonly modules: readonly NativeAllocationProfileModule[]
  readonly rawProfile: Dynamic
}

interface MutableNativeAllocationProfileStack {
  attributedAllocationBytes: number
  sampledBytes: number
  stack: readonly string[]
}

const MaxTopStacks = 20
const MaxSummaryStacks = 10
const UnknownStack = '(unknown)'

const toArray = (value: Dynamic): readonly Dynamic[] => {
  return Array.isArray(value) ? value : []
}

const toBytes = (value: Dynamic): number => {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0
}

const toString = (value: Dynamic): string => {
  return typeof value === 'string' ? value : ''
}

const isRecord = (value: Dynamic): boolean => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const normalizeStack = (value: Dynamic): readonly string[] => {
  return toArray(value).filter((frame): frame is string => typeof frame === 'string')
}

const normalizeModules = (value: Dynamic): readonly NativeAllocationProfileModule[] => {
  const modules: NativeAllocationProfileModule[] = []
  for (const module of toArray(value)) {
    if (!isRecord(module)) {
      continue
    }
    modules.push({
      baseAddress: toString(module.baseAddress),
      name: toString(module.name),
      size: toBytes(module.size),
      uuid: toString(module.uuid),
    })
  }
  return modules
}

const getTopStacks = (rows: Iterable<NativeAllocationProfileStack>): readonly NativeAllocationProfileStack[] => {
  return [...rows]
    .toSorted(
      (a, b) =>
        b.attributedAllocationBytes - a.attributedAllocationBytes ||
        b.sampledBytes - a.sampledBytes ||
        a.stack.join('\n').localeCompare(b.stack.join('\n')),
    )
    .slice(0, MaxTopStacks)
}

export const getNativeAllocationProfileSummary = (
  profile: Dynamic,
  supported = true,
  unsupportedReason = '',
): NativeAllocationProfileSummary => {
  const samples = toArray(profile?.samples)
  const stackMap = new Map<string, MutableNativeAllocationProfileStack>()
  let attributedAllocationBytes = 0
  let sampleCount = 0
  let sampledBytes = 0

  for (const sample of samples) {
    if (!isRecord(sample)) {
      continue
    }
    const stack = normalizeStack(sample.stack)
    const sampleSize = toBytes(sample.size)
    const attributedBytes = toBytes(sample.total)
    const key = JSON.stringify(stack)
    const row = stackMap.get(key) || {
      attributedAllocationBytes: 0,
      sampledBytes: 0,
      stack,
    }
    row.attributedAllocationBytes += attributedBytes
    row.sampledBytes += sampleSize
    stackMap.set(key, row)
    attributedAllocationBytes += attributedBytes
    sampledBytes += sampleSize
    sampleCount++
  }

  const modules = normalizeModules(profile?.modules)
  return {
    metrics: {
      attributedAllocationBytes,
      moduleCount: modules.length,
      sampleCount,
      sampledBytes,
    },
    modules,
    rawProfile: profile,
    supported,
    topStacks: getTopStacks(stackMap.values()),
    unsupportedReason,
  }
}

export const formatNativeAllocationProfileSummary = ({
  metrics,
  supported,
  topStacks,
  unsupportedReason,
}: NativeAllocationProfileDisplay): string => {
  const lines = [
    'Native allocation profile:',
    `supported | ${supported}`,
    `sampleCount | ${metrics.sampleCount}`,
    `sampledBytes | ${metrics.sampledBytes}`,
    `attributedAllocationBytes | ${metrics.attributedAllocationBytes}`,
    `moduleCount | ${metrics.moduleCount}`,
  ]
  if (!supported && unsupportedReason) {
    lines.push(`unsupportedReason | ${unsupportedReason}`)
  }
  if (topStacks.length > 0) {
    lines.push('top allocation stacks:')
    lines.push('attributedAllocationBytes | sampledBytes | stack')
    for (const row of topStacks.slice(0, MaxSummaryStacks)) {
      lines.push(`${row.attributedAllocationBytes} | ${row.sampledBytes} | ${row.stack.join(' <- ') || UnknownStack}`)
    }
  }
  return lines.join('\n')
}
