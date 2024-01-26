import * as ObjectType from '../ObjectType/ObjectType.js'
import * as Promises from '../Promises/Promises.js'

/**
 *
 * @param {any} ipc
 * @returns
 */
export const createRpc = (ipc) => {
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
    objectType: ObjectType.Rpc,
    callbacks,
    listeners,
    onceListeners,
    invoke(method, params) {
      const { resolve, reject, promise } = Promises.withResolvers()
      const id = _id++
      callbacks[id] = { resolve, reject }
      ipc.send({
        method,
        params,
        id,
      })
      return promise
    },
    invokeWithSession(sessionId, method, params) {
      const { resolve, reject, promise } = Promises.withResolvers()
      const id = _id++
      callbacks[id] = { resolve, reject }
      ipc.send({
        sessionId,
        method,
        params,
        id,
      })
      return promise
    },
    on(event, listener) {
      listeners[event] = listener
    },
    off(event, listener) {
      delete listeners[event]
    },
    once(event) {
      return new Promise((resolve) => {
        onceListeners[event] = resolve
      })
    },
  }
}
