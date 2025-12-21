export const createSessionRpcConnection = (rpc: any, sessionId: string) => {
  return {
    listeners: rpc.listeners,
    callbacks: rpc.callbacks,
    invoke(method: string, params: any) {
      return rpc.invokeWithSession(sessionId, method, params)
    },
    on: rpc.on,
    once: rpc.once,
    sessionId,
  }
}
