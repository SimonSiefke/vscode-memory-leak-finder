import * as Assert from '../Assert/Assert.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const testWorkerRunTest = (ipc, connectionId, formattedPaths) => {
  Assert.object(ipc)
  Assert.array(formattedPaths)
  return JsonRpc.invoke(ipc, TestWorkerCommandType.RunTest, connectionId, formattedPaths)
}
