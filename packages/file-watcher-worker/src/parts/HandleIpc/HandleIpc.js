import * as HandleMessage from '../HandleMessage/HandleMessage.js'

/**
 * @param {{ send: (message: unknown) => void; on: (event: string, listener: (message: unknown) => void) => void }} ipc
 */
export const handleIpc = async (ipc) => {
  /**
   * @param {unknown} message
   */
  const callback = (message) => {
    ipc.send(message)
  }
  /**
   * @param {unknown} message
   */
  const handleMessage = async (message) => {
    const msg = /** @type {{ method: string; params: unknown[] }} */ (message)
    const { method, params } = msg
    const fn = HandleMessage.getFn(method)
    // @ts-ignore - params is an array, spread is safe
    fn(...params, callback)
  }
  ipc.on('message', handleMessage)
}
