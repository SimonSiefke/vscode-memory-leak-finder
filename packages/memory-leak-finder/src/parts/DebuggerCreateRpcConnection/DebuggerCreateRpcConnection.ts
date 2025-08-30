import * as ObjectType from '../ObjectType/ObjectType.ts'

/**
 *
 * @param {any} ipc
 * @returns
 */
export const createRpc = (ipc: any) => {
  const callbacks = Object.create(null)
  const handleMessage = (message: any) => {
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
    invoke(method: string, params: any) {
      const { resolve, reject, promise } = Promise.withResolvers<any>()
      const id = _id++
      callbacks[id] = { resolve, reject }
      ipc.send({
        method,
        params,
        id,
      })
      return promise
    },
    invokeWithSession(sessionId: string, method: string, params: any) {
      const { resolve, reject, promise } = Promise.withResolvers<any>()
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
    on(event: string, listener: any) {
      listeners[event] = listener
    },
    off(event: string, listener: any) {
      delete listener[event]
    },
    once(event: string) {
      const { resolve, promise } = Promise.withResolvers<any>()
      onceListeners[event] = resolve
      return promise
    },
  }
}
