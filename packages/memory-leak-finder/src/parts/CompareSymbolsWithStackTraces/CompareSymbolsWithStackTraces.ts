import type { MeasureContext } from '../Types/Types.ts'
import type { SymbolWithStackTrace } from '../GetSymbolsWithStackTraces/GetSymbolsWithStackTraces.ts'

export interface SymbolStackTraceResult {
  readonly count: number
  readonly delta: number
  readonly description: string
  readonly name: string
  readonly registered: boolean
  readonly stackTrace: readonly string[]
}

const getKey = (symbol: SymbolWithStackTrace): string => {
  return JSON.stringify([symbol.description, symbol.registered, symbol.stackTrace])
}

export const compareSymbolsWithStackTraces = (
  _before: readonly SymbolWithStackTrace[],
  after: readonly SymbolWithStackTrace[],
  context: MeasureContext = {},
): readonly SymbolStackTraceResult[] => {
  const runs = typeof context.runs === 'number' && Number.isFinite(context.runs) ? Math.max(1, context.runs) : 1
  const counts = new Map<string, { count: number; symbol: SymbolWithStackTrace }>()
  for (const symbol of after) {
    const key = getKey(symbol)
    const entry = counts.get(key)
    if (entry) {
      entry.count++
    } else {
      counts.set(key, { count: 1, symbol })
    }
  }
  return [...counts.values()]
    .filter((entry) => entry.count >= runs)
    .map(({ count, symbol }) => ({
      count,
      delta: count,
      description: symbol.description,
      name: symbol.name,
      registered: symbol.registered,
      stackTrace: symbol.stackTrace.split('\n'),
    }))
    .toSorted((a, b) => b.delta - a.delta)
}
