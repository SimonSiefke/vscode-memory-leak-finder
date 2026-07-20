import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export const testWorkerSetupTest = (
  rpc,
  connectionId,
  absolutePath,
  forceRun,
  timeouts,
  isGithubActions,
  allowCopilotAuthInCi,
  runNetworkTestsAnyway,
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
