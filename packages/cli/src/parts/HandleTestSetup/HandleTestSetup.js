import * as GetHandleTestSetupMessage from '../GetHandleTestSetupMessage/GetHandleTestSetupMessage.js'
import * as Stdout from '../Stdout/Stdout.js'
import * as IsGithubActions from '../IsGithubActions/IsGithubActions.js'

export const handleTestSetup = () => {
  if (IsGithubActions.isGithubActions) {
    return
  }
  const message = GetHandleTestSetupMessage.getHandleTestSetupMessage()
  Stdout.write(message)
}
