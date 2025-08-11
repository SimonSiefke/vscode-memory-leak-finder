import * as Assert from '../Assert/Assert.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const connectElectron = (rpc, connectionId, headlessMode, webSocketUrl, isFirstConnection, canUseIdleCallback) => {
  Assert.object(rpc)
  Assert.number(connectionId)
  Assert.boolean(headlessMode)
  Assert.string(webSocketUrl)
  Assert.boolean(isFirstConnection)
  Assert.boolean(canUseIdleCallback)
  return rpc.invoke(TestWorkerCommandType.ConnectElectron, connectionId, headlessMode, webSocketUrl, isFirstConnection, canUseIdleCallback)
}
