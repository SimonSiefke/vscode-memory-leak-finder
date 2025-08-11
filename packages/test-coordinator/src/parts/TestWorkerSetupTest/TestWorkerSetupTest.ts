import * as Assert from '../Assert/Assert.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const testWorkerSetupTest = (rpc, connectionId, absolutePath, forceRun, timeouts) => {
  Assert.object(rpc)
  Assert.string(absolutePath)
  return rpc.invoke(TestWorkerCommandType.SetupTest, connectionId, absolutePath, forceRun, timeouts)
}
