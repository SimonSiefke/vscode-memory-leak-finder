import * as GetHandleTestRunningMessage from '../GetHandleTestRunningMessage/GetHandleTestRunningMessage.js'
import * as Stdout from '../Stdout/Stdout.js'
import * as IsGithubActions from '../IsGithubActions/IsGithubActions.js'

export const handleTestRunning = (file, relativeDirName, fileName, isFirst) => {
  if (IsGithubActions.isGithubActions) {
    return
  }
  const message = GetHandleTestRunningMessage.getHandleTestRunningMessage(file, relativeDirName, fileName, isFirst)
  Stdout.write(message)
}
