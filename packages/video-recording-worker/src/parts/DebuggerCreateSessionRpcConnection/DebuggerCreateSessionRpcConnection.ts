export const createSessionRpcConnection = (rpc: any, sessionId: string) => {
  return {
    callbacks: rpc.callbacks,
    invoke(method: string, params: any) {
      return rpc.invokeWithSession(sessionId, method, params)
    },
    listeners: rpc.listeners,
    on: rpc.on,
    once: rpc.once,
    sessionId,
  }
}
