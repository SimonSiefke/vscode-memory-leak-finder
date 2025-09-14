import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export const setup = (rpc: any, connectionId: number, measureId: string) => {
  Assert.object(rpc)
  Assert.number(connectionId)
  Assert.string(measureId)
  return rpc.invoke(TestWorkerCommandType.MemoryLeakFinderSetup, connectionId, measureId)
}
