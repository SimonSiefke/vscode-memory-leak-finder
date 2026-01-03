import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerRunTest from '../TestWorkerRunTest/TestWorkerRunTest.ts'

export const testWorkerRunTests = async ({
  absolutePath,
  connectionId,
  forceRun,
  platform,
  rpc,
  runMode,
  runs,
}: {
  absolutePath: string
  connectionId: number
  forceRun: boolean
  platform: string
  rpc: any
  runMode: number
  runs: number
}) => {
  Assert.object(rpc)
  Assert.string(absolutePath)
  Assert.boolean(forceRun)
  Assert.string(platform)
  for (let i = 0; i < runs; i++) {
    await TestWorkerRunTest.testWorkerRunTest({
      absolutePath,
      connectionId,
      forceRun,
      platform,
      rpc,
      runMode,
    })
  }
}
