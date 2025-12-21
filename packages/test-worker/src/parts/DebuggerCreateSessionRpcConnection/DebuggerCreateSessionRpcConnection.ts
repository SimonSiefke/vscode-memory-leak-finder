export const createSessionRpcConnection = (rpc, sessionId) => {
  return {
    callbacks: rpc.callbacks,
    invoke(method, params) {
      return rpc.invokeWithSession(sessionId, method, params)
    },
    listeners: rpc.listeners,
    off: rpc.off,
    on: rpc.on,
    once: rpc.once,
    sessionId,
  }
}
