import * as Assert from '../Assert/Assert.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const setup = (rpc, connectionId, measureId) => {
  Assert.object(rpc)
  Assert.number(connectionId)
  Assert.string(measureId)
  return rpc.invoke(TestWorkerCommandType.MemoryLeakFinderSetup, connectionId, connectionId, measureId)
}
