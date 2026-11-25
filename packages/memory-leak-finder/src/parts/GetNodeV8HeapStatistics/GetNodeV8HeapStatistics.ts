import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export interface NodeV8HeapStatistics {
  readonly external_memory: number | null
  readonly malloced_memory: number | null
  readonly number_of_detached_contexts: number | null
  readonly number_of_native_contexts: number | null
  /** Lifetime peak of the process, not a value for the measured interval. */
  readonly peak_malloced_memory: number | null
  readonly total_global_handles_size: number | null
  readonly total_physical_size: number | null
  readonly used_global_handles_size: number | null
}

export interface NodeV8HeapSpace {
  readonly physical_space_size: number | null
  readonly space_name: string
  readonly space_size: number | null
  readonly space_used_size: number | null
}

export interface NodeV8Heap {
  readonly heapSpaces: readonly NodeV8HeapSpace[]
  readonly heapStatistics: NodeV8HeapStatistics
}

const heapStatisticsKeys = [
  'external_memory',
  'malloced_memory',
  'number_of_detached_contexts',
  'number_of_native_contexts',
  'peak_malloced_memory',
  'total_global_handles_size',
  'total_physical_size',
  'used_global_handles_size',
] as const

const heapSpaceKeys = ['physical_space_size', 'space_size', 'space_used_size'] as const

// Runs in the inspected target. Browser realms have no `process`, so this returns null there.
const expression = `(() => {
  try {
    let v8
    if (typeof process === 'object' && process !== null && typeof process.getBuiltinModule === 'function') {
      v8 = process.getBuiltinModule('node:v8')
    } else if (typeof require === 'function') {
      v8 = require('node:v8')
    }
    if (!v8 || typeof v8.getHeapStatistics !== 'function' || typeof v8.getHeapSpaceStatistics !== 'function') {
      return null
    }
    const heapStatistics = v8.getHeapStatistics()
    const pick = (source, keys) => Object.fromEntries(keys.map((key) => [key, source[key]]))
    return {
      heapSpaces: v8.getHeapSpaceStatistics().map((space) => pick(space, ${JSON.stringify(['space_name', ...heapSpaceKeys])})),
      heapStatistics: pick(heapStatistics, ${JSON.stringify(heapStatisticsKeys)}),
    }
  } catch {
    return null
  }
})()`

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const toNumber = (value: unknown): number | null => {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

const parseHeapSpace = (value: unknown): NodeV8HeapSpace | null => {
  if (!isRecord(value) || typeof value.space_name !== 'string') {
    return null
  }
  return {
    physical_space_size: toNumber(value.physical_space_size),
    space_name: value.space_name,
    space_size: toNumber(value.space_size),
    space_used_size: toNumber(value.space_used_size),
  }
}

export const parseNodeV8Heap = (value: unknown): NodeV8Heap | null => {
  if (!isRecord(value) || !isRecord(value.heapStatistics) || !Array.isArray(value.heapSpaces)) {
    return null
  }
  const { heapStatistics } = value
  const heapSpaces: NodeV8HeapSpace[] = []
  for (const space of value.heapSpaces) {
    const parsed = parseHeapSpace(space)
    if (parsed) {
      heapSpaces.push(parsed)
    }
  }
  return {
    heapSpaces,
    heapStatistics: {
      external_memory: toNumber(heapStatistics.external_memory),
      malloced_memory: toNumber(heapStatistics.malloced_memory),
      number_of_detached_contexts: toNumber(heapStatistics.number_of_detached_contexts),
      number_of_native_contexts: toNumber(heapStatistics.number_of_native_contexts),
      peak_malloced_memory: toNumber(heapStatistics.peak_malloced_memory),
      total_global_handles_size: toNumber(heapStatistics.total_global_handles_size),
      total_physical_size: toNumber(heapStatistics.total_physical_size),
      used_global_handles_size: toNumber(heapStatistics.used_global_handles_size),
    },
  }
}

/**
 * Reads `v8.getHeapStatistics()` and `v8.getHeapSpaceStatistics()` from a Node.js target.
 * Returns null when the target has no Node.js `v8` module or the evaluation fails.
 */
export const getNodeV8HeapStatistics = async (session: Session): Promise<NodeV8Heap | null> => {
  try {
    const value = await DevtoolsProtocolRuntime.evaluate(session, {
      expression,
      returnByValue: true,
    })
    return parseNodeV8Heap(value)
  } catch {
    return null
  }
}
