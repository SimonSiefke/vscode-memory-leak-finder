import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerRunTest from '../TestWorkerRunTest/TestWorkerRunTest.ts'

export const testWorkerRunTests = async (
  rpc: any,
  connectionId: number,
  absolutePath: string,
  forceRun: boolean,
  runMode: number,
  platform: string,
  runs: number,
) => {
  Assert.object(rpc)
  Assert.string(absolutePath)
  Assert.boolean(forceRun)
  Assert.string(platform)
  for (let i = 0; i < runs; i++) {
    await TestWorkerRunTest.testWorkerRunTest(rpc, connectionId, absolutePath, forceRun, runMode, platform)
  }
}
