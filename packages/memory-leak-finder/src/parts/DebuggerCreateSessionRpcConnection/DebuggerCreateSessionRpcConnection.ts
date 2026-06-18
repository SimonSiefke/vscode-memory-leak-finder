import type { Dynamic } from '../Types/Types.ts'
export const createSessionRpcConnection = (rpc: Dynamic, sessionId: string): Dynamic => {
  return {
    callbacks: rpc.callbacks,
    connectionClosed: rpc.connectionClosed,
    dispose() {
      rpc.dispose()
    },
    invoke(method: string, params?: Dynamic): Promise<Dynamic> {
      return rpc.invokeWithSession(sessionId, method, params)
    },
    listeners: rpc.listeners,
    off: rpc.off,
    on: rpc.on,
    once: rpc.once,
    sessionId,
  }
}
