import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerRunTest from '../TestWorkerRunTest/TestWorkerRunTest.ts'

export const testWorkerRunTests = async (
  rpc: any,
  connectionId: number,
  absolutePath: string,
  forceRun: boolean,
  runMode: number,
  platform,
  runs: number,
  runCompletion?: () => Promise<unknown>,
) => {
  Assert.object(rpc)
  Assert.string(absolutePath)
  Assert.boolean(forceRun)
  Assert.string(platform)
  for (let i = 0; i < runs; i++) {
    await TestWorkerRunTest.testWorkerRunTest(rpc, connectionId, absolutePath, forceRun, runMode, platform)
    if (runCompletion) {
      await runCompletion()
    }
  }
}
