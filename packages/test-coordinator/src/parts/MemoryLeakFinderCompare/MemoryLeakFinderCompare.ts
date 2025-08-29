import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export const compare = (rpc: any, connectionId: number, before: any, after: any, context: any) => {
  Assert.object(rpc)
  Assert.number(connectionId)
  return rpc.invoke(TestWorkerCommandType.MemoryLeakFinderCompare, connectionId, before, after, context)
}
