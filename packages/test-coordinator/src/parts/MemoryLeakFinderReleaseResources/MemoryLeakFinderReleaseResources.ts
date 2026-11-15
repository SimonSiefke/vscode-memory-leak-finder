import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export const releaseResources = async (rpc: any, connectionId: number): Promise<void> => {
  Assert.object(rpc)
  Assert.number(connectionId)
  await rpc.invoke(TestWorkerCommandType.MemoryLeakFinderReleaseResources, connectionId)
}
