import type { MeasureInstance, RpcConnection } from '../Types/Types.ts'

export interface MemoryLeakFinderState {
  after?: unknown
  before?: unknown
  readonly measure: MeasureInstance
  readonly pid: number
  readonly rpc: RpcConnection
}

export const state: {
  instances: Record<number, MemoryLeakFinderState>
} = {
  instances: Object.create(null),
}

export const set = (connectionId: number, instance: MemoryLeakFinderState): void => {
  state.instances[connectionId] = instance
}

export const get = (connectionId: number): MemoryLeakFinderState | undefined => {
  return state.instances[connectionId]
}

export const update = (connectionId: number, update: Partial<MemoryLeakFinderState>): void => {
  const existing = get(connectionId)
  if (!existing) {
    throw new Error(`no state found for connectionId ${connectionId}`)
  }
  const updated = { ...existing, ...update }
  set(connectionId, updated)
}
