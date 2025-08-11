import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export const compare = (rpc, connectionId, before, after) => {
  Assert.object(rpc)
  Assert.number(connectionId)
  return rpc.invoke(TestWorkerCommandType.MemoryLeakFinderCompare, connectionId, before, after)
}
