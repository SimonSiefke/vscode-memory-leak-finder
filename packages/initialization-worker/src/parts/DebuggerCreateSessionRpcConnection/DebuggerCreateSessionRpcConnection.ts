export const createSessionRpcConnection = (rpc, sessionId) => {
  return {
    callbacks: rpc.callbacks,
    invoke(method, params) {
      return rpc.invokeWithSession(sessionId, method, params)
    },
    listeners: rpc.listeners,
    on: rpc.on,
    once: rpc.once,
    sessionId,
  }
}
