// Common type definitions

export interface DevToolsMessage {
  readonly id?: number
  readonly method: string
  readonly params?: Record<string, unknown>
  readonly sessionId?: string
  readonly result?: unknown
  readonly error?: {
    readonly code: number
    readonly message: string
  }
}

export interface IpcMessage {
  readonly id?: string | number
  readonly method?: string
  readonly params?: unknown[]
  readonly result?: unknown
  readonly error?: unknown
}

export interface RpcConnection {
  invoke(method: string, params?: Record<string, unknown>): Promise<unknown>
  invokeWithSession?(sessionId: string, method: string, params?: Record<string, unknown>): Promise<unknown>
  on(event: string, listener: (...args: unknown[]) => void): void
  off(event: string, listener: (...args: unknown[]) => void): void
  once?(event: string): Promise<unknown>
  send?(message: IpcMessage): void
}

export interface WebSocketLike {
  readonly readyState: number
  addEventListener(type: string, listener: (event: Event) => void): void
  removeEventListener(type: string, listener: (event: Event) => void): void
  send(data: string): void
  close(): void
}

export interface NodeProcessLike {
  send?(message: unknown): void
  on(event: string, listener: (...args: unknown[]) => void): void
  removeListener(event: string, listener: (...args: unknown[]) => void): void
}

export interface MeasureResult {
  readonly type: string
  readonly value: unknown
}

export interface MemoryLeakFinderInstance {
  readonly id: string
  readonly measure: unknown
  readonly before?: MeasureResult
  readonly after?: MeasureResult
}

export interface ExecuteFunction {
  (command: string, ...args: unknown[]): unknown
}

export interface CommandFunction {
  (...args: unknown[]): unknown
}

export interface ErrorObject {
  readonly name?: string
  readonly message?: string
  readonly stack?: string
  readonly code?: string | number
  readonly codeFrame?: string
}