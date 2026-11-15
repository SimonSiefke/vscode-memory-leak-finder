import type { Dynamic } from '../Types/Types.ts'
import * as ObjectType from '../ObjectType/ObjectType.ts'
/**
 *
 * @param {unknown} ipc
 * @returns
 */
export const createRpc = (ipc: Dynamic, { requestTimeoutMs = 0 } = {}) => {
  const callbacks = Object.create(null)
  const timers = new Map<number, NodeJS.Timeout>()
  let disposed = false
  const rejectPending = () => {
    for (const id of Object.keys(callbacks)) {
      clearTimeout(timers.get(Number(id)))
      callbacks[id].reject(new Error('DevTools connection closed'))
      delete callbacks[id]
    }
    timers.clear()
  }
  ipc.onclose = rejectPending
  const handleMessage = (message: Dynamic) => {
    if ('id' in message) {
      if (!callbacks[message.id]) return
      clearTimeout(timers.get(message.id))
      timers.delete(message.id)
      if ('result' in message) {
        callbacks[message.id].resolve(message)
      } else if ('error' in message) {
        callbacks[message.id].resolve(message)
      }
      delete callbacks[message.id]
    } else {
      const listener = listeners[message.method]
      if (listener) {
        listener(message)
      }
      const onceListener = onceListeners[message.method]
      if (onceListener) {
        onceListener(message)
        delete onceListener[message.method]
      }
    }
  }
  ipc.onmessage = handleMessage
  const listeners = Object.create(null)
  const onceListeners = Object.create(null)
  let _id = 0
  const invoke = (method: string, params: Dynamic, sessionId?: string) => {
    if (disposed || ipc.connectionClosed) return Promise.reject(new Error('DevTools connection closed'))
    const { promise, reject, resolve } = Promise.withResolvers<Dynamic>()
    const id = _id++
    callbacks[id] = { reject, resolve }
    if (requestTimeoutMs) {
      timers.set(
        id,
        setTimeout(() => {
          delete callbacks[id]
          timers.delete(id)
          reject(new Error(`${method} timed out`))
        }, requestTimeoutMs),
      )
    }
    try {
      ipc.send({ id, method, params, ...(sessionId === undefined ? {} : { sessionId }) })
    } catch (error) {
      clearTimeout(timers.get(id))
      timers.delete(id)
      delete callbacks[id]
      reject(error)
    }
    return promise
  }
  return {
    callbacks,
    dispose() {
      disposed = true
      rejectPending()
      for (const event of Object.keys(listeners)) delete listeners[event]
      for (const event of Object.keys(onceListeners)) delete onceListeners[event]
      ipc.dispose()
    },
    invoke(method: string, params: Dynamic) {
      return invoke(method, params)
    },
    invokeWithSession(sessionId: string, method: string, params: Dynamic) {
      return invoke(method, params, sessionId)
    },
    listeners,
    objectType: ObjectType.Rpc,
    off(event: string, listener: Dynamic) {
      if (listeners[event] === listener) delete listeners[event]
    },
    on(event: string, listener: Dynamic) {
      listeners[event] = listener
    },
    once(event: string) {
      const { promise, resolve } = Promise.withResolvers<Dynamic>()
      onceListeners[event] = resolve
      return promise
    },
    onceListeners,
  }
}
