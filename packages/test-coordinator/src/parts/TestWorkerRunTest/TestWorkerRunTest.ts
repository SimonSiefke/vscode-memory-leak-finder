import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export const testWorkerRunTest = ({
  absolutePath,
  connectionId,
  forceRun,
  platform,
  rpc,
  runMode,
}: {
  absolutePath: string
  connectionId: number
  forceRun: boolean
  platform: string
  rpc: any
  runMode: number
}) => {
  Assert.object(rpc)
  Assert.string(absolutePath)
  Assert.boolean(forceRun)
  Assert.string(platform)
  return rpc.invoke(TestWorkerCommandType.RunTest, {
    absolutePath,
    connectionId,
    forceRun,
    platform,
    runMode,
  })
}
