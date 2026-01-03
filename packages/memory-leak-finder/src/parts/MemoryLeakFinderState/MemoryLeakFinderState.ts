export interface RpcConnection {
  readonly connectionClosed?: () => boolean
  dispose(): void
  invoke(method: string, params?: any): Promise<any>
  invokeWithSession?(sessionId: string, method: string, params?: any): Promise<any>
  readonly [key: string]: any
}

export interface Measure {
  readonly id: string
  start(): Promise<any>
  stop(): Promise<any>
  compare(before: any, after: any, context: any): Promise<any>
  releaseResources(): Promise<void>
}

export interface MemoryLeakFinderState {
  readonly measure: Measure
  readonly rpc: RpcConnection
  before?: any
  after?: any
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
