import * as HandleMessage from '../HandleMessage/HandleMessage.js'

export const handleIpc = (ipc) => {
  const callback = (message) => {
    ipc.send(message)
  }
  const handleMessage = async (message) => {
    const { method, params } = message
    const fn = await HandleMessage.getFn(method)
    fn(...params, callback)
  }
  ipc.on('message', handleMessage)
}
