import type { Dynamic } from '../Types/Types.ts'

interface StackTraceTable {
  readonly stackTraceIndexes: readonly number[]
  readonly stackTraces: readonly string[]
}

const isStackTraceTable = (value: Dynamic): value is StackTraceTable => {
  return value && typeof value === 'object' && Array.isArray(value.stackTraceIndexes) && Array.isArray(value.stackTraces)
}

export const expandStackTraceTable = (table: Dynamic, expectedLength: number): readonly string[] => {
  if (!isStackTraceTable(table)) {
    throw new TypeError('Expected compact stack trace table')
  }
  const { stackTraceIndexes, stackTraces } = table
  if (stackTraceIndexes.length !== expectedLength) {
    throw new Error(`stack trace index length mismatch: expected ${expectedLength}, got ${stackTraceIndexes.length}`)
  }
  return stackTraceIndexes.map((stackTraceIndex) => {
    if (!Number.isInteger(stackTraceIndex) || stackTraceIndex < 0 || stackTraceIndex >= stackTraces.length) {
      throw new Error(`Invalid stack trace index: ${stackTraceIndex}`)
    }
    const stackTrace = stackTraces[stackTraceIndex]
    if (typeof stackTrace !== 'string') {
      throw new TypeError(`Expected stack trace at index ${stackTraceIndex} to be a string`)
    }
    return stackTrace
  })
}
