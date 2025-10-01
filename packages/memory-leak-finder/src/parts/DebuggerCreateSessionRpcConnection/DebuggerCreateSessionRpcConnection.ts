export const createSessionRpcConnection = (rpc: any, sessionId: string): any => {
  return {
    listeners: rpc.listeners,
    callbacks: rpc.callbacks,
    invoke(method: string, params?: any): Promise<any> {
      return rpc.invokeWithSession(sessionId, method, params)
    },
    on: rpc.on,
    off: rpc.off,
    once: rpc.once,
    sessionId,
    dispose() {
      rpc.dispose()
    },
  }
}
