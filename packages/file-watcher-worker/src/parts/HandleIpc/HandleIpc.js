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
    const { method, params } = message
    const fn = HandleMessage.getFn(method)
    fn(...params, callback)
  }
  ipc.on('message', handleMessage)
}
