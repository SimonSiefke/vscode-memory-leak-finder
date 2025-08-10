import * as GetHandleTestRunningMessage from '../GetHandleTestRunningMessage/GetHandleTestRunningMessage.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as IsGithubActions from '../IsGithubActions/IsGithubActions.ts'

export const handleTestRunning = async (file: string, relativeDirName: string, fileName: string, isFirst: boolean): Promise<void> => {
  if (IsGithubActions.isGithubActions) {
    return
  }
  const message = await GetHandleTestRunningMessage.getHandleTestRunningMessage(file, relativeDirName, fileName, isFirst)
  await Stdout.write(message)
}
