import * as Assert from '../Assert/Assert.js'
import * as HandleJsonRpcMessage from '../HandleJsonRpcMessage/HandleJsonRpcMessage.js'

export const handleIpc = (ipc, execute, resolve) => {
  Assert.object(ipc)
  const handleMessage = (message) => {
    return HandleJsonRpcMessage.handleJsonRpcMessage(ipc, message, execute, resolve)
  }
  ipc.on('message', handleMessage)
}
