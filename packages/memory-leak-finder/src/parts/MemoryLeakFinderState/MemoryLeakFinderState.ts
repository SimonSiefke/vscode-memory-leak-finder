export interface RpcConnection {
  readonly connectionClosed?: () => boolean
  dispose(): void
  invoke(method: string, params?: any): Promise<any>
  invokeWithSession?(sessionId: string, method: string, params?: any): Promise<any>
  readonly [key: string]: any
}

export interface Measure {
  compare(before: any, after: any, context: any): Promise<any>
  readonly id: string
  releaseResources(): Promise<void>
  start(): Promise<any>
  stop(): Promise<any>
}

export interface MemoryLeakFinderState {
  after?: any
  before?: any
  readonly measure: Measure
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
