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
  const results: any[] = []
  for (let i = 0; i < runs; i++) {
    const result = await TestWorkerRunTest.testWorkerRunTest(rpc, connectionId, absolutePath, forceRun, runMode, platform)
    results.push(result)
    if (runCompletion) {
      await runCompletion()
    }
  }
  return results
}
