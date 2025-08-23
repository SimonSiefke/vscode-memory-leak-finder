import * as GetHandleTestSkippedMessage from '../GetHandleTestSkippedMessage/GetHandleTestSkippedMessage.ts'
import * as HandleTestStateChange from '../HandleTestStateChange/HandleTestStateChange.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'
import * as Stdout from '../Stdout/Stdout.ts'

export const handleTestSkipped = async (file: string, relativeDirName: string, fileName: string, duration: number): Promise<void> => {
  const message = await GetHandleTestSkippedMessage.getHandleTestSkippedMessage(file, relativeDirName, fileName, duration)
  await HandleTestStateChange.handleTestStateChange(message)
  if (StdinDataState.isGithubActions()) {
    const end = await StdoutWorker.invoke('Stdout.getGitHubGroupEndMessage')
    await Stdout.write(end)
  }
}
