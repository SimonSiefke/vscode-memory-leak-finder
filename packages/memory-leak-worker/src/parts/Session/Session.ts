export interface Session {
  readonly type: string
  readonly id?: string
  readonly rpc?: any
  readonly url?: string
  readonly sessionId?: string
  readonly objectType?: string
}
