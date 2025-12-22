export const createSessionRpcConnection = (rpc: any, sessionId: string): any => {
  return {
    callbacks: rpc.callbacks,
    dispose() {
      rpc.dispose()
    },
    invoke(method: string, params?: any): Promise<any> {
      return rpc.invokeWithSession(sessionId, method, params)
    },
    listeners: rpc.listeners,
    off: rpc.off,
    on: rpc.on,
    once: rpc.once,
    sessionId,
  }
}
