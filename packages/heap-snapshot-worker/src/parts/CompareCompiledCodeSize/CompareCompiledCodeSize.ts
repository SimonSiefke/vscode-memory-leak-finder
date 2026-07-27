import type { ScriptInfo } from '../AddOriginalSources/AddOriginalSources.ts'
import { addOriginalSources } from '../AddOriginalSources/AddOriginalSources.ts'
import {
  analyzeCompiledCodeSnapshot,
  type CodeSizeBreakdown,
  type CompiledCodeSnapshotAnalysis,
  type CompiledCodeTotals,
} from '../AnalyzeCompiledCodeSnapshot/AnalyzeCompiledCodeSnapshot.ts'
import type { CompareResult } from '../CompareHeapSnapshotsFunctionsInternal2/CompareResult.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

const MAX_FUNCTION_ROWS = 100
const MAX_FILE_ROWS = 100

export interface CompiledCodeFunctionDelta {
  readonly after: CodeSizeBreakdown
  readonly before: CodeSizeBreakdown
  readonly delta: CodeSizeBreakdown
  readonly name: string
  readonly originalLocation?: string
  readonly originalName?: string | null
  readonly sourceLocation?: string
}

export interface CompiledCodeFileDelta {
  readonly after: CodeSizeBreakdown
  readonly before: CodeSizeBreakdown
  readonly delta: CodeSizeBreakdown
  readonly source: string
}

export interface CompiledCodeComparison {
  readonly functionCount: number
  readonly isLeak: false
  readonly largestFiles: readonly CompiledCodeFileDelta[]
  readonly largestFunctions: readonly CompiledCodeFunctionDelta[]
  readonly largestGrowth: readonly CompiledCodeFunctionDelta[]
  readonly sourceFileCount: number
  readonly totals: {
    readonly after: CompiledCodeTotals
    readonly before: CompiledCodeTotals
    readonly delta: CompiledCodeTotals
  }
}

interface FunctionDeltaInternal extends CompiledCodeFunctionDelta {
  readonly column: number
  readonly key: string
  readonly line: number
  readonly scriptId: number
}

interface EnrichedFunctionDelta extends CompiledCodeFunctionDelta {
  readonly originalSource?: string | null
}

const emptyBreakdown: CodeSizeBreakdown = {
  bytecodeBytes: 0,
  instructionBytes: 0,
  metadataBytes: 0,
  totalBytes: 0,
}

const toBreakdown = (value: CodeSizeBreakdown | undefined): CodeSizeBreakdown => {
  if (!value) {
    return emptyBreakdown
  }
  return {
    bytecodeBytes: value.bytecodeBytes,
    instructionBytes: value.instructionBytes,
    metadataBytes: value.metadataBytes,
    totalBytes: value.totalBytes,
  }
}

const subtractBreakdown = (after: CodeSizeBreakdown, before: CodeSizeBreakdown): CodeSizeBreakdown => ({
  bytecodeBytes: after.bytecodeBytes - before.bytecodeBytes,
  instructionBytes: after.instructionBytes - before.instructionBytes,
  metadataBytes: after.metadataBytes - before.metadataBytes,
  totalBytes: after.totalBytes - before.totalBytes,
})

const addBreakdown = (target: CodeSizeBreakdown, value: CodeSizeBreakdown): CodeSizeBreakdown => ({
  bytecodeBytes: target.bytecodeBytes + value.bytecodeBytes,
  instructionBytes: target.instructionBytes + value.instructionBytes,
  metadataBytes: target.metadataBytes + value.metadataBytes,
  totalBytes: target.totalBytes + value.totalBytes,
})

const subtractTotals = (after: CompiledCodeTotals, before: CompiledCodeTotals): CompiledCodeTotals => ({
  ...subtractBreakdown(after, before),
  attributedBytes: after.attributedBytes - before.attributedBytes,
  sharedBytes: after.sharedBytes - before.sharedBytes,
  unattributedBytes: after.unattributedBytes - before.unattributedBytes,
})

const compareByAfterSize = (a: FunctionDeltaInternal, b: FunctionDeltaInternal): number => {
  return b.after.totalBytes - a.after.totalBytes || a.key.localeCompare(b.key)
}

const compareByGrowth = (a: FunctionDeltaInternal, b: FunctionDeltaInternal): number => {
  return b.delta.totalBytes - a.delta.totalBytes || a.key.localeCompare(b.key)
}

const compareFilesByAfterSize = (a: CompiledCodeFileDelta, b: CompiledCodeFileDelta): number => {
  return b.after.totalBytes - a.after.totalBytes || a.source.localeCompare(b.source)
}

const createFunctionDeltas = (
  before: CompiledCodeSnapshotAnalysis,
  after: CompiledCodeSnapshotAnalysis,
): readonly FunctionDeltaInternal[] => {
  const beforeMap = new Map(before.functions.map((item) => [item.key, item]))
  const afterMap = new Map(after.functions.map((item) => [item.key, item]))
  const keys = new Set([...beforeMap.keys(), ...afterMap.keys()])
  return [...keys].map((key): FunctionDeltaInternal => {
    const beforeItem = beforeMap.get(key)
    const afterItem = afterMap.get(key)
    const location = afterItem || beforeItem!
    const afterBreakdown = toBreakdown(afterItem)
    const beforeBreakdown = toBreakdown(beforeItem)
    return {
      after: afterBreakdown,
      before: beforeBreakdown,
      column: location.column,
      delta: subtractBreakdown(afterBreakdown, beforeBreakdown),
      key,
      line: location.line,
      name: location.name,
      scriptId: location.scriptId,
    }
  })
}

const enrichFunctions = async (
  items: readonly FunctionDeltaInternal[],
  scriptMap: Readonly<Record<number, ScriptInfo>>,
): Promise<ReadonlyMap<string, EnrichedFunctionDelta>> => {
  const sourceItems: CompareResult[] = items.map((item) => ({
    column: item.column,
    count: item.after.totalBytes,
    delta: item.delta.totalBytes,
    line: item.line,
    name: item.name,
    scriptId: item.scriptId,
  }))
  const enriched = await addOriginalSources(sourceItems, scriptMap)
  const result = new Map<string, EnrichedFunctionDelta>()
  for (let index = 0; index < items.length; index++) {
    const item = items[index]
    const source = enriched[index]
    result.set(item.key, {
      after: item.after,
      before: item.before,
      delta: item.delta,
      name: item.name,
      ...(source.originalLocation ? { originalLocation: source.originalLocation } : {}),
      ...(source.originalName !== undefined ? { originalName: source.originalName } : {}),
      ...(source.originalSource !== undefined ? { originalSource: source.originalSource } : {}),
      ...(source.sourceLocation ? { sourceLocation: source.sourceLocation } : {}),
    })
  }
  return result
}

const removeLocationSuffix = (location: string): string => {
  return location.replace(/:\d+:\d+$/, '')
}

const getSource = (item: EnrichedFunctionDelta): string => {
  return (
    item.originalSource ||
    (item.originalLocation && removeLocationSuffix(item.originalLocation)) ||
    (item.sourceLocation && removeLocationSuffix(item.sourceLocation)) ||
    'Unknown'
  )
}

const createFileDeltas = (items: readonly EnrichedFunctionDelta[]): readonly CompiledCodeFileDelta[] => {
  const files = new Map<string, CompiledCodeFileDelta>()
  for (const item of items) {
    const source = getSource(item)
    const existing = files.get(source) || {
      after: emptyBreakdown,
      before: emptyBreakdown,
      delta: emptyBreakdown,
      source,
    }
    files.set(source, {
      after: addBreakdown(existing.after, item.after),
      before: addBreakdown(existing.before, item.before),
      delta: addBreakdown(existing.delta, item.delta),
      source,
    })
  }
  return [...files.values()]
}

export const compareCompiledCodeSizeInternal = async (
  before: CompiledCodeSnapshotAnalysis,
  after: CompiledCodeSnapshotAnalysis,
  scriptMap: Readonly<Record<number, ScriptInfo>>,
): Promise<CompiledCodeComparison> => {
  const deltas = createFunctionDeltas(before, after)
  const largestFunctions = deltas.toSorted(compareByAfterSize).slice(0, MAX_FUNCTION_ROWS)
  const largestGrowth = deltas
    .filter((item) => item.delta.totalBytes > 0)
    .toSorted(compareByGrowth)
    .slice(0, MAX_FUNCTION_ROWS)
  const enriched = await enrichFunctions(deltas, scriptMap)
  const files = createFileDeltas([...enriched.values()])
  return {
    functionCount: deltas.length,
    isLeak: false,
    largestFiles: files.toSorted(compareFilesByAfterSize).slice(0, MAX_FILE_ROWS),
    largestFunctions: largestFunctions.map((item) => enriched.get(item.key)!),
    largestGrowth: largestGrowth.map((item) => enriched.get(item.key)!),
    sourceFileCount: files.length,
    totals: {
      after: after.totals,
      before: before.totals,
      delta: subtractTotals(after.totals, before.totals),
    },
  }
}

export const compareCompiledCodeSize = async (
  beforePath: string,
  afterPath: string,
  scriptMap: Readonly<Record<number, ScriptInfo>>,
): Promise<CompiledCodeComparison> => {
  const analyzePath = async (path: string): Promise<CompiledCodeSnapshotAnalysis> => {
    const snapshot = await prepareHeapSnapshot(path, { parseStrings: true })
    return analyzeCompiledCodeSnapshot(snapshot)
  }
  const before = await analyzePath(beforePath)
  const after = await analyzePath(afterPath)
  return compareCompiledCodeSizeInternal(before, after, scriptMap)
}
