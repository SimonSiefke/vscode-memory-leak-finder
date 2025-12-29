import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export const testWorkerSetupTest = (
  rpc: any,
  connectionId: any,
  absolutePath: string,
  forceRun: boolean,
  inspectExtensions: boolean,
  timeouts: any,
) => {
  Assert.object(rpc)
  Assert.string(absolutePath)
  return rpc.invoke(TestWorkerCommandType.SetupTest, connectionId, absolutePath, forceRun, inspectExtensions, timeouts)
}
