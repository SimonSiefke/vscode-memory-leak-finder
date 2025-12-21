export const createTargetRpcConnection = (rpc, targetId, sessionId) => {
  return {
    callbacks: rpc.callbacks,
    invoke(method, params) {
      return rpc.invokeWithTarget(targetId, sessionId, method, params)
    },
    listeners: rpc.listeners,
    on: rpc.on,
    once: rpc.once,
    sessionId,
    targetId,
  }
}
