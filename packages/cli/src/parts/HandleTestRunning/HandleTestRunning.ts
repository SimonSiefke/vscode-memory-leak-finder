import * as IsGithubActions from '../IsGithubActions/IsGithubActions.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const handleTestRunning = async (file: string, relativeDirName: string, fileName: string, isFirst: boolean): Promise<void> => {
  if (IsGithubActions.isGithubActions) {
    return
  }
  const message = await StdoutWorker.invoke('Stdout.getHandleTestRunningMessage', file, relativeDirName, fileName, isFirst)
  await Stdout.write(message)
}
