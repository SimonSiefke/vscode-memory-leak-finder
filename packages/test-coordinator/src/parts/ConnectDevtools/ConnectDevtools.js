import * as Assert from '../Assert/Assert.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const connectDevtools = (
  rpc,
  connectionId,
  devtoolsWebSocketUrl,
  monkeyPatchedElectron,
  electronObjectId,
  callFrameId,
  isFirstConnection,
) => {
  Assert.object(rpc)
  Assert.number(connectionId)
  Assert.string(devtoolsWebSocketUrl)
  return rpc.invoke(
    TestWorkerCommandType.ConnectDevtools,
    connectionId,
    devtoolsWebSocketUrl,
    monkeyPatchedElectron,
    electronObjectId,
    callFrameId,
    isFirstConnection,
  )
}
