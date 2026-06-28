import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export const testWorkerSetupTest = (rpc, connectionId, absolutePath, forceRun, timeouts, isGithubActions, allowCopilotAuthInCi) => {
  Assert.object(rpc)
  Assert.string(absolutePath)
  Assert.boolean(isGithubActions)
  Assert.boolean(allowCopilotAuthInCi)
  return rpc.invoke(TestWorkerCommandType.SetupTest, connectionId, absolutePath, forceRun, timeouts, isGithubActions, allowCopilotAuthInCi)
}
