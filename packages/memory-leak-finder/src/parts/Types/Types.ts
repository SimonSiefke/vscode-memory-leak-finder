export type UnknownRecord = Record<string, unknown>
export type Dynamic = ReturnType<typeof JSON.parse>

export type JsonRpcParams = readonly unknown[] | UnknownRecord | undefined

export interface RpcConnection {
  readonly callbacks?: UnknownRecord
  readonly connectionClosed?: () => boolean
  readonly listeners?: UnknownRecord
  readonly onceListeners?: UnknownRecord
  readonly sessionId?: string
  dispose(): void | Promise<void>
  invoke<T = unknown>(method: string, ...params: readonly unknown[]): Promise<T>
  invokeWithSession?<T = unknown>(sessionId: string, method: string, ...params: readonly unknown[]): Promise<T>
  off?(event: string, listener: unknown): void
  on?(event: string, listener: unknown): void
  once?<T = unknown>(event: string): Promise<T>
}

export type Session = RpcConnection

export interface MeasureContext extends UnknownRecord {
  readonly runs?: number
  readonly rpc?: RpcConnection
  readonly threshold?: number
}

export interface MeasureInstance {
  readonly id: string
  readonly targets?: readonly unknown[]
  compare(before: unknown, after: unknown, context: MeasureContext): Promise<unknown> | unknown
  isLeak?(value: unknown): boolean
  releaseResources(): Promise<void> | void
  start(): Promise<unknown> | unknown
  stop(): Promise<unknown> | unknown
  summary?(value: unknown): unknown
}

export interface MeasureDefinition {
  readonly id: string
  readonly targets?: readonly unknown[]
  compare?(before: unknown, after: unknown, context: MeasureContext): Promise<unknown> | unknown
  create?(session: Session): readonly unknown[]
  isLeak?(value: unknown): boolean
  releaseResources?(...args: readonly unknown[]): Promise<void> | void
  start?(...args: readonly unknown[]): Promise<unknown> | unknown
  stop?(...args: readonly unknown[]): Promise<unknown> | unknown
  summary?(value: unknown): unknown
}

export interface MemoryLeakFinderModule {
  readonly Measures: Record<string, MeasureDefinition>
  combine(measures: readonly MeasureInstance[] | MeasureInstance): MeasureInstance
}

export interface ScriptMapEntry {
  readonly sourceMapUrl?: string
  readonly url?: string
}

export type ScriptMap = Record<string, ScriptMapEntry>

export interface SourcePosition {
  readonly column: number
  readonly line: number
}

export interface SourceLocation {
  readonly columnNumber?: number
  readonly lineNumber?: number
  readonly scriptId?: string
  readonly sourceMapUrl?: string
  readonly url?: string
}

export interface RemoteObjectPreviewProperty {
  readonly name?: string
  readonly type?: string
  readonly value?: string
}

export interface RemoteObjectPreview {
  readonly description?: string
  readonly properties?: readonly RemoteObjectPreviewProperty[]
  readonly subtype?: string
  readonly type?: string
}

export interface RemoteObject {
  readonly className?: string
  readonly description?: string
  readonly objectId?: string
  readonly preview?: RemoteObjectPreview
  readonly subtype?: string
  readonly type?: string
  readonly value?: unknown
}

export interface PropertyDescriptor {
  readonly configurable?: boolean
  readonly enumerable?: boolean
  readonly get?: RemoteObject
  readonly name: string
  readonly set?: RemoteObject
  readonly value?: RemoteObject
  readonly writable?: boolean
}

export interface CountDelta {
  readonly count?: number
  readonly delta: number
}

export interface NamedCount {
  readonly count?: number
  readonly name?: string
  readonly totalCount?: number
}

export interface StackTraceItem extends UnknownRecord {
  readonly count?: number
  readonly delta?: number
  readonly originalIndex?: number
  readonly originalStack?: readonly unknown[]
  readonly preview?: RemoteObjectPreview
  readonly sourcesHash?: string | null
  readonly stackTrace?: string | readonly unknown[]
}
