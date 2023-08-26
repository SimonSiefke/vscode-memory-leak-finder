import * as Assert from '../Assert/Assert.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const testWorkerSetupTest = (ipc, connectionId, absolutePath) => {
  Assert.object(ipc)
  Assert.string(absolutePath)
  return JsonRpc.invoke(ipc, TestWorkerCommandType.SetupTest, connectionId, absolutePath)
}
