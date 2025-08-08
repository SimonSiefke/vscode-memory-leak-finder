import * as Assert from '../Assert/Assert.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const startWithWorkers = (rpc, connectionId, targetId) => {
  Assert.object(rpc)
  Assert.number(connectionId)
  Assert.string(targetId)
  return rpc.invoke(TestWorkerCommandType.MemoryLeakFinderStartWithWorkers, connectionId, targetId)
}
