interface RpcConnection {
  readonly callbacks: Record<string, unknown>
  invokeWithSession(sessionId: string, method: string, params?: unknown): Promise<unknown>
  readonly listeners: Record<string, unknown>
  on(event: string, listener: (...args: unknown[]) => void): void
  once(event: string): Promise<unknown>
}

export const createSessionRpcConnection = (rpc: RpcConnection, sessionId: string) => {
  return {
    callbacks: rpc.callbacks,
    invoke(method: string, params?: unknown) {
      return rpc.invokeWithSession(sessionId, method, params)
    },
    listeners: rpc.listeners,
    on: rpc.on,
    once: rpc.once,
    sessionId,
  }
}
