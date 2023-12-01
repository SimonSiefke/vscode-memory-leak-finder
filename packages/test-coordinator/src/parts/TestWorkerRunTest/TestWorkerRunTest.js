import * as Assert from '../Assert/Assert.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const testWorkerRunTest = (ipc, connectionId, absolutePath, forceRun) => {
  Assert.object(ipc)
  Assert.string(absolutePath)
  Assert.boolean(forceRun)
  return JsonRpc.invoke(ipc, TestWorkerCommandType.RunTest, connectionId, absolutePath, forceRun)
}
