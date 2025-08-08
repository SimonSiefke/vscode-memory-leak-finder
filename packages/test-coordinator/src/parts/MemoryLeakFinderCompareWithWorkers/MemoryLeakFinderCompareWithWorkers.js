import * as Assert from '../Assert/Assert.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const compareWithWorkers = (rpc, connectionId, before, after) => {
  Assert.object(rpc)
  Assert.number(connectionId)
  Assert.object(before)
  Assert.object(after)
  return rpc.invoke(TestWorkerCommandType.MemoryLeakFinderCompareWithWorkers, connectionId, before, after)
}
