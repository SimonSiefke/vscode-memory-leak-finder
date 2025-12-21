export interface TargetInfo {
  readonly targetId: string
  readonly type: 'worker' | string
  readonly title: string
  readonly url: string
  readonly attached: boolean
  readonly browserContextId: string
}

export interface AttachedToTargetMessage {
  readonly method: string
  readonly params: {
    readonly sessionId: string
    readonly targetInfo: TargetInfo
  }
}
