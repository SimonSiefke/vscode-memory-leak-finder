export const createSessionRpcConnection = (rpc, sessionId) => {
  return {
    listeners: rpc.listeners,
    callbacks: rpc.callbacks,
    invoke(method, params) {
      return rpc.invokeWithSession(sessionId, method, params)
    },
    on: rpc.on,
    once: rpc.once,
    sessionId,
  }
}
