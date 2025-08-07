import * as GetHandleTestSetupMessage from '../GetHandleTestSetupMessage/GetHandleTestSetupMessage.js'
import * as Stdout from '../Stdout/Stdout.js'
import * as IsGithubActions from '../IsGithubActions/IsGithubActions.js'

export const handleTestSetup = async () => {
  if (IsGithubActions.isGithubActions) {
    return
  }
  const message = GetHandleTestSetupMessage.getHandleTestSetupMessage()
  await Stdout.write(message)
}
