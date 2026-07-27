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

export interface CompiledCodeFunctionDelta {
  readonly after: CodeSizeBreakdown
  readonly before: CodeSizeBreakdown
  readonly delta: CodeSizeBreakdown
  readonly name: string
  readonly originalLocation?: string
  readonly originalName?: string | null
  readonly sourceLocation?: string
}

export interface CompiledCodeComparison {
  readonly isLeak: false
  readonly largestFunctions: readonly CompiledCodeFunctionDelta[]
  readonly largestGrowth: readonly CompiledCodeFunctionDelta[]
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

const emptyBreakdown: CodeSizeBreakdown = {
  bytecodeBytes: 0,
  instructionBytes: 0,
  metadataBytes: 0,
  totalBytes: 0,
}

const subtractBreakdown = (after: CodeSizeBreakdown, before: CodeSizeBreakdown): CodeSizeBreakdown => ({
  bytecodeBytes: after.bytecodeBytes - before.bytecodeBytes,
  instructionBytes: after.instructionBytes - before.instructionBytes,
  metadataBytes: after.metadataBytes - before.metadataBytes,
  totalBytes: after.totalBytes - before.totalBytes,
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
    return {
      after: afterItem || emptyBreakdown,
      before: beforeItem || emptyBreakdown,
      column: location.column,
      delta: subtractBreakdown(afterItem || emptyBreakdown, beforeItem || emptyBreakdown),
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
): Promise<ReadonlyMap<string, CompiledCodeFunctionDelta>> => {
  const sourceItems: CompareResult[] = items.map((item) => ({
    column: item.column,
    count: item.after.totalBytes,
    delta: item.delta.totalBytes,
    line: item.line,
    name: item.name,
    scriptId: item.scriptId,
  }))
  const enriched = await addOriginalSources(sourceItems, scriptMap)
  const result = new Map<string, CompiledCodeFunctionDelta>()
  for (let index = 0; index < items.length; index++) {
    const item = items[index]
    const source = enriched[index]
    result.set(item.key, {
      after: item.after,
      before: item.before,
      delta: item.delta,
      name: source.originalName || item.name,
      ...(source.originalLocation ? { originalLocation: source.originalLocation } : {}),
      ...(source.originalName !== undefined ? { originalName: source.originalName } : {}),
      ...(source.sourceLocation ? { sourceLocation: source.sourceLocation } : {}),
    })
  }
  return result
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
  const selected = new Map<string, FunctionDeltaInternal>()
  for (const item of [...largestFunctions, ...largestGrowth]) {
    selected.set(item.key, item)
  }
  const enriched = await enrichFunctions([...selected.values()], scriptMap)
  return {
    isLeak: false,
    largestFunctions: largestFunctions.map((item) => enriched.get(item.key)!),
    largestGrowth: largestGrowth.map((item) => enriched.get(item.key)!),
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
  const [beforeSnapshot, afterSnapshot] = await Promise.all([
    prepareHeapSnapshot(beforePath, { parseStrings: true }),
    prepareHeapSnapshot(afterPath, { parseStrings: true }),
  ])
  return compareCompiledCodeSizeInternal(analyzeCompiledCodeSnapshot(beforeSnapshot), analyzeCompiledCodeSnapshot(afterSnapshot), scriptMap)
}
