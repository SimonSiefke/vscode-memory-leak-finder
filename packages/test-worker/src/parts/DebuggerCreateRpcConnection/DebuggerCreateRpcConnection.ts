import * as ObjectType from '../ObjectType/ObjectType.ts'

/**
 *
 * @param {any} ipc
 * @returns
 */
export const createRpc = (ipc, canUseIdleCallback) => {
  const callbacks = Object.create(null)
  const handleMessage = (message) => {
    if ('id' in message) {
      if ('result' in message) {
        callbacks[message.id].resolve(message)
      } else if ('error' in message) {
        callbacks[message.id].resolve(message)
      }
      delete callbacks[message.id]
    } else {
      const currentOnceListeners = onceListeners[message.method]
      delete onceListeners[message.method]
      for (const listener of [...(listeners[message.method] || [])]) listener(message)
      for (const listener of currentOnceListeners || []) listener(message)
    }
  }
  ipc.onmessage = handleMessage

  const listeners = Object.create(null)
  const onceListeners = Object.create(null)
  let _id = 0
  return {
    callbacks,
    canUseIdleCallback,
    invoke(method, params) {
      const { promise, reject, resolve } = Promise.withResolvers()
      const id = _id++
      callbacks[id] = { reject, resolve }
      ipc.send({
        id,
        method,
        params,
      })
      return promise
    },
    invokeWithSession(sessionId, method, params) {
      const { promise, reject, resolve } = Promise.withResolvers()
      const id = _id++
      callbacks[id] = { reject, resolve }
      ipc.send({
        id,
        method,
        params,
        sessionId,
      })
      return promise
    },
    invokeWithTarget(targetId, sessionId, method, params) {
      const { promise, reject, resolve } = Promise.withResolvers()
      const id = _id++
      callbacks[id] = { reject, resolve }
      ipc.send({
        id,
        method,
        params,
        sessionId,
        targetId,
      })
      return promise
    },
    listeners,
    objectType: ObjectType.Rpc,
    off(event, listener) {
      const handlers = listeners[event]
      if (!handlers) return
      handlers.delete(listener)
      if (!handlers.size) delete listeners[event]
    },
    on(event, listener) {
      ;(listeners[event] ||= new Set()).add(listener)
    },
    once(event) {
      const { promise, resolve } = Promise.withResolvers()
      ;(onceListeners[event] ||= new Set()).add(resolve)
      return promise
    },
    onceListeners,
  }
}
