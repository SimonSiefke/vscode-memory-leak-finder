// Common type definitions

export interface DevToolsMessage {
  readonly error?: {
    readonly code: number
    readonly message: string
  }
  readonly id?: number
  readonly method: string
  readonly params?: Record<string, unknown>
  readonly result?: unknown
  readonly sessionId?: string
}

export interface IpcMessage {
  readonly error?: unknown
  readonly id?: string | number
  readonly jsonrpc?: string
  readonly method?: string
  readonly params?: unknown[]
  readonly result?: unknown
}

export interface RpcConnection {
  invoke(method: string, params?: Record<string, unknown>): Promise<unknown>
  invokeWithSession?(sessionId: string, method: string, params?: Record<string, unknown>): Promise<unknown>
  off(event: string, listener: (...args: unknown[]) => void): void
  on(event: string, listener: (...args: unknown[]) => void): void
  once?(event: string): Promise<unknown>
  send?(message: IpcMessage): void
}

export interface WebSocketLike {
  addEventListener(type: string, listener: (event: Event) => void): void
  close(): void
  readonly readyState: number
  removeEventListener(type: string, listener: (event: Event) => void): void
  send(data: string): void
}

export interface NodeProcessLike {
  on(event: string, listener: (...args: unknown[]) => void): void
  removeListener(event: string, listener: (...args: unknown[]) => void): void
  send?(message: unknown): void
}

export interface MeasureResult {
  readonly type: string
  readonly value: unknown
}

export interface MemoryLeakFinderInstance {
  readonly after?: MeasureResult
  readonly before?: MeasureResult
  readonly id: string
  readonly measure: unknown
}

export interface ExecuteFunction {
  (command: string, ...args: unknown[]): unknown
}

export interface CommandFunction {
  (...args: unknown[]): Promise<unknown> | unknown
}

export interface ErrorObject {
  readonly cause?: () => ErrorObject
  readonly code?: string | number
  readonly codeFrame?: string
  readonly message?: string
  readonly name?: string
  readonly stack?: string
}

export interface StackFrame {
  readonly column: number
  readonly file: string
  readonly line: number
  readonly path?: string
}
