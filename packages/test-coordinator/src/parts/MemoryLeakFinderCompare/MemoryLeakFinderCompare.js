import * as Assert from '../Assert/Assert.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const compare = (ipc, connectionId, before, after) => {
  Assert.object(ipc)
  Assert.number(connectionId)
  return JsonRpc.invoke(ipc, TestWorkerCommandType.MemoryLeakFinderCompare, connectionId, before, after)
}
