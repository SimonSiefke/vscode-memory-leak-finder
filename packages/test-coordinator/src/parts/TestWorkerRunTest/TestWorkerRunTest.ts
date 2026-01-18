import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export const testWorkerRunTest = (rpc: { invoke: (method: string, ...args: readonly unknown[]) => Promise<unknown> }, connectionId: number, absolutePath: string, forceRun: boolean, runMode: unknown, platform: string): Promise<unknown> => {
  Assert.object(rpc)
  Assert.string(absolutePath)
  Assert.boolean(forceRun)
  Assert.string(platform)
  return rpc.invoke(TestWorkerCommandType.RunTest, connectionId, absolutePath, forceRun, runMode, platform)
}
