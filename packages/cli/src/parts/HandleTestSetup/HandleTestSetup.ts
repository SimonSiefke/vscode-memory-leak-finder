import * as GetHandleTestSetupMessage from '../GetHandleTestSetupMessage/GetHandleTestSetupMessage.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as IsGithubActions from '../IsGithubActions/IsGithubActions.ts'

export const handleTestSetup = async (): Promise<void> => {
  if (IsGithubActions.isGithubActions) {
    return
  }
  const message = GetHandleTestSetupMessage.getHandleTestSetupMessage()
  await Stdout.write(message)
}
