import * as JsonRpcEvent from '../JsonRpcEvent/JsonRpcEvent.js'
import * as JsonRpcRequest from '../JsonRpcRequest/JsonRpcRequest.js'
import * as UnwrapJsonRpcResult from '../UnwrapJsonRpcResult/UnwrapJsonRpcResult.js'

export const send = (ipc, method, ...params) => {
  const message = JsonRpcEvent.create(method, params)
  ipc.send(message)
}

export const invoke = async (ipc, method, ...params) => {
  const { message, promise } = JsonRpcRequest.create(method, params)
  ipc.send(message)
  const responseMessage = await promise
  const result = UnwrapJsonRpcResult.unwrapJsonRpcResult(responseMessage)
  return result
}
