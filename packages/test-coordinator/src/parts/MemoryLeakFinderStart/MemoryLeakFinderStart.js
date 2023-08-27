import * as Assert from '../Assert/Assert.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const start = (ipc, connectionId) => {
  Assert.object(ipc)
  Assert.number(connectionId)
  return JsonRpc.invoke(ipc, TestWorkerCommandType.MemoryLeakFinderStart, connectionId)
}
