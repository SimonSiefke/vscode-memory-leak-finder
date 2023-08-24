import * as Assert from '../Assert/Assert.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const connect = (ipc, connectionId, webSocketUrl) => {
  Assert.object(ipc)
  Assert.number(connectionId)
  Assert.string(webSocketUrl)
  return JsonRpc.invoke(ipc, TestWorkerCommandType.Connect, connectionId, webSocketUrl)
}
