import * as HandleMessage from '../HandleMessage/HandleMessage.js'

export const handleIpc = async (ipc) => {
  const callback = (message) => {
    ipc.send(message)
  }
  const handleMessage = async (message) => {
    const { method, params } = message
    const fn = HandleMessage.getFn(method)
    fn(...params, callback)
  }
  ipc.on('message', handleMessage)
}
