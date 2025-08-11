import * as Assert from '../Assert/Assert.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'

const prepareError = (error) => {
  return error
}

const logError = () => {}

const requiresSocket = () => {
  return false
}

export const handleIpc = (ipc, execute, resolve) => {
  Assert.object(ipc)
  const handleMessage = (message) => {
    return JsonRpc.handleJsonRpcMessage(ipc, message, execute, resolve, prepareError, logError, requiresSocket)
  }
  ipc.on('message', handleMessage)
}
