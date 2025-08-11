import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export const start = (rpc, connectionId, targetId) => {
  Assert.object(rpc)
  Assert.number(connectionId)
  Assert.string(targetId)
  return rpc.invoke(TestWorkerCommandType.MemoryLeakFinderStart, connectionId, targetId)
}
