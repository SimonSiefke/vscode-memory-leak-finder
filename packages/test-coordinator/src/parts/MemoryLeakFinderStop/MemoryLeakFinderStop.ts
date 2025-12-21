import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export const stop = (rpc: any, connectionId: number) => {
  Assert.object(rpc)
  Assert.number(connectionId)
  return rpc.invoke(TestWorkerCommandType.MemoryLeakFinderStop, connectionId)
}
