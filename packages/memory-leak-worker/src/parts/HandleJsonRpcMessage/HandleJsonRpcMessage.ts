import * as GetResponse from '../GetResponse/GetResponse.ts'

export const handleJsonRpcMessage = async (ipc: any, message: any, execute: any, resolve: any): Promise<void> => {
  if ('result' in message || 'error' in message) {
    resolve(message.id, message)
    return
  }
  const response = await GetResponse.getResponse(message, execute)
  if ('id' in message) {
    ipc.send(response)
  }
}
