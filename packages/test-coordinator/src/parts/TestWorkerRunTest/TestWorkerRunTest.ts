import * as Assert from '../Assert/Assert.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const testWorkerRunTest = (rpc, connectionId, absolutePath, forceRun, runMode) => {
  Assert.object(rpc)
  Assert.string(absolutePath)
  Assert.boolean(forceRun)
  return rpc.invoke(TestWorkerCommandType.RunTest, connectionId, absolutePath, forceRun, runMode)
}
