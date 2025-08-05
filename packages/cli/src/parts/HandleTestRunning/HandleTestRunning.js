import * as GetHandleTestRunningMessage from '../GetHandleTestRunningMessage/GetHandleTestRunningMessage.js'
import * as Stdout from '../Stdout/Stdout.js'
import * as IsGithubActions from '../IsGithubActions/IsGithubActions.js'

export const handleTestRunning = async (file, relativeDirName, fileName, isFirst) => {
  if (IsGithubActions.isGithubActions) {
    return
  }
  const message = GetHandleTestRunningMessage.getHandleTestRunningMessage(file, relativeDirName, fileName, isFirst)
  await Stdout.write(message)
}
