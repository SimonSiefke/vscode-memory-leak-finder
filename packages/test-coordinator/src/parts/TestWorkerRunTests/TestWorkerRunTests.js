import * as Assert from '../Assert/Assert.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const testWorkerRunTests = (ipc, connectionId, formattedPaths) => {
  Assert.object(ipc)
  Assert.array(formattedPaths)
  return JsonRpc.invoke(ipc, TestWorkerCommandType.RunTests, connectionId, formattedPaths)
}
