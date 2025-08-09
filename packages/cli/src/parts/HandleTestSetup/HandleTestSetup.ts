import * as IsGithubActions from '../IsGithubActions/IsGithubActions.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const handleTestSetup = async (): Promise<void> => {
  if (IsGithubActions.isGithubActions) {
    return
  }
  const message = await StdoutWorker.invoke('Stdout.getHandleTestSetupMessage')
  await Stdout.write(message)
}
