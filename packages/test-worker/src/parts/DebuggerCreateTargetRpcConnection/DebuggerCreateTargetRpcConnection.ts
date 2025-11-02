export const createTargetRpcConnection = (rpc, targetId, sessionId) => {
  return {
    listeners: rpc.listeners,
    callbacks: rpc.callbacks,
    invoke(method, params) {
      return rpc.invokeWithTarget(targetId, sessionId, method, params)
    },
    on: rpc.on,
    once: rpc.once,
    sessionId,
    targetId,
  }
}
