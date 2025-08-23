import * as GetHandleTestRunningMessage from '../GetHandleTestRunningMessage/GetHandleTestRunningMessage.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const handleTestRunning = async (file: string, relativeDirName: string, fileName: string, isFirst: boolean): Promise<void> => {
  if (StdinDataState.isGithubActions()) {
    const message = await StdoutWorker.invoke('Stdout.getGitHubGroupStartMessage', fileName)
    await Stdout.write(message)
    return
  }
  const message = await GetHandleTestRunningMessage.getHandleTestRunningMessage(file, relativeDirName, fileName, isFirst)
  await Stdout.write(message)
}
