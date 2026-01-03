import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export const testWorkerSetupTest = ({
  absolutePath,
  connectionId,
  forceRun,
  isGithubActions,
  rpc,
  timeouts,
}: {
  absolutePath: string
  connectionId: number
  forceRun: boolean
  isGithubActions: boolean
  rpc: any
  timeouts: boolean
}) => {
  Assert.object(rpc)
  Assert.string(absolutePath)
  Assert.boolean(isGithubActions)
  return rpc.invoke(TestWorkerCommandType.SetupTest, {
    absolutePath,
    connectionId,
    forceRun,
    isGithubActions,
    timeouts,
  })
}
