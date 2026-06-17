import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

<<<<<<< HEAD
export const testWorkerSetupTest = (rpc: { invoke: (method: string, ...args: readonly unknown[]) => Promise<unknown> }, connectionId: number, absolutePath: string, forceRun: boolean, timeouts: unknown, isGithubActions: boolean): Promise<unknown> => {
=======
export const testWorkerSetupTest = (rpc, connectionId, absolutePath, forceRun, timeouts, isGithubActions, allowCopilotAuthInCi) => {
>>>>>>> origin/main
  Assert.object(rpc)
  Assert.string(absolutePath)
  Assert.boolean(isGithubActions)
  Assert.boolean(allowCopilotAuthInCi)
  return rpc.invoke(TestWorkerCommandType.SetupTest, connectionId, absolutePath, forceRun, timeouts, isGithubActions, allowCopilotAuthInCi)
}
