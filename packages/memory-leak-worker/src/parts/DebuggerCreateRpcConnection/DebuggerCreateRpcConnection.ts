import * as ObjectType from '../ObjectType/ObjectType.js'
import * as Promises from '../Promises/Promises.js'

/**
 *
 * @param {any} ipc
 * @returns
 */
export const createRpc = (ipc: any): any => {
  const callbacks = Object.create(null)
  const handleMessage = (message: any): void => {
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
    invoke(method: string, params?: any): Promise<any> {
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
    invokeWithSession(sessionId: string, method: string, params?: any): Promise<any> {
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
    on(event: string, listener: any): void {
      listeners[event] = listener
    },
    off(event: string, listener: any): void {
      delete listeners[event]
    },
    once(event: string): Promise<any> {
      return new Promise((resolve) => {
        onceListeners[event] = resolve
      })
    },
  }
}
