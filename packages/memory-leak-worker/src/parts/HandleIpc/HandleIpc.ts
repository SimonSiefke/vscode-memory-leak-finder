import * as HandleJsonRpcMessage from '../HandleJsonRpcMessage/HandleJsonRpcMessage.ts'

export const handleIpc = (ipc: any, execute: any, resolve: any): void => {
  const handleMessage = (message: any): void => {
    HandleJsonRpcMessage.handleJsonRpcMessage(ipc, message, execute, resolve)
  }
  ipc.on('message', handleMessage)
}
