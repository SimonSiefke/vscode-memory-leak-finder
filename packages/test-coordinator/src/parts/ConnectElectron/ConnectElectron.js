import * as Assert from '../Assert/Assert.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const connectElectron = (ipc, connectionId, headlessMode, webSocketUrl, isFirstConnection) => {
  Assert.object(ipc)
  Assert.number(connectionId)
  Assert.boolean(headlessMode)
  Assert.string(webSocketUrl)
  return JsonRpc.invoke(ipc, TestWorkerCommandType.ConnectElectron, connectionId, headlessMode, webSocketUrl, isFirstConnection)
}
