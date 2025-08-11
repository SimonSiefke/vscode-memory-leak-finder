import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export const testWorkerRunTest = (rpc, connectionId, absolutePath, forceRun, runMode) => {
  Assert.object(rpc)
  Assert.string(absolutePath)
  Assert.boolean(forceRun)
  return rpc.invoke(TestWorkerCommandType.RunTest, connectionId, absolutePath, forceRun, runMode)
}
