import * as Callback from '../Callback/Callback.js'
import * as Command from '../Command/Command.js'
import * as HandleJsonRpcMessage from '../HandleJsonRpcMessage/HandleJsonRpcMessage.js'

export const handleIpc = (ipc) => {
  const callback = (message) => {
    ipc.send(message)
  }
  const execute = (method, ...params) => {
    return Command.execute(method, ...params, callback)
  }
  const handleMessage = (message) => {
    return HandleJsonRpcMessage.handleJsonRpcMessage(ipc, message, execute, Callback.resolve)
  }
  ipc.on('message', handleMessage)
}
