import * as HandleJsonRpcMessage from '../HandleJsonRpcMessage/HandleJsonRpcMessage.ts'

export const handleIpc = (ipc: any, execute: (command: string, ...args: any[]) => any, resolve: (id: string, value: any) => void): void => {
  const handleMessage = (message: any): void => {
    HandleJsonRpcMessage.handleJsonRpcMessage(ipc, message, execute, resolve)
  }
  ipc.on('message', handleMessage)
}
