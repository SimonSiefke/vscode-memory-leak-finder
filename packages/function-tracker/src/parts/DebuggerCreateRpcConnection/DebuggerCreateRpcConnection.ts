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
      delete listener[event]
    },
    on(event, listener) {
      listeners[event] = listener
    },
    once(event) {
      const { promise, resolve } = Promise.withResolvers()
      onceListeners[event] = resolve
      return promise
    },
    onceListeners,
  }
}
