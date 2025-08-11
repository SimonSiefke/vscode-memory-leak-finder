import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export const testWorkerSetupTest = (rpc, connectionId, absolutePath, forceRun, timeouts) => {
  Assert.object(rpc)
  Assert.string(absolutePath)
  return rpc.invoke(TestWorkerCommandType.SetupTest, connectionId, absolutePath, forceRun, timeouts)
}
