export const createSessionRpcConnection = (rpc, sessionId) => {
  return {
    listeners: rpc.listeners,
    callbacks: rpc.callbacks,
    invoke(method, params) {
      return rpc.invokeWithSession(sessionId, method, params)
    },
    on: rpc.on,
    off: rpc.off,
    once: rpc.once,
    sessionId,
  }
}
