import * as HandleJsonRpcMessage from '../HandleJsonRpcMessage/HandleJsonRpcMessage.js'

export const handleIpc = (ipc) => {
  ipc.onmessage = HandleJsonRpcMessage.handleJsonRpcMessage
}
