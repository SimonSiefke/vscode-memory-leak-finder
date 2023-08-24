import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const connect = (ipc, webSocketUrl) => {
  return JsonRpc.invoke(ipc, TestWorkerCommandType.Connect, webSocketUrl)
}
