import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export const testWorkerSetupTest = (
  rpc: any,
  connectionId: number,
  absolutePath: string,
  forceRun: boolean,
  timeouts: any,
  isGithubActions: boolean,
  allowCopilotAuthInCi: boolean,
  runNetworkTestsAnyway: boolean,
) => {
  Assert.object(rpc)
  Assert.string(absolutePath)
  Assert.boolean(isGithubActions)
  Assert.boolean(allowCopilotAuthInCi)
  Assert.boolean(runNetworkTestsAnyway)
  return rpc.invoke(
    TestWorkerCommandType.SetupTest,
    connectionId,
    absolutePath,
    forceRun,
    timeouts,
    isGithubActions,
    allowCopilotAuthInCi,
    runNetworkTestsAnyway,
  )
}
