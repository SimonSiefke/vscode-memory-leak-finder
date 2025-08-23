import * as GetHandleTestFailedMessage from '../GetHandleTestFailedMessage/GetHandleTestFailedMessage.ts'
import * as HandleTestStateChange from '../HandleTestStateChange/HandleTestStateChange.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'
import * as Stdout from '../Stdout/Stdout.ts'

export const handleTestFailed = async (
  file: string,
  relativeDirName: string,
  relativeFilePath: string,
  fileName: string,
  error: any,
): Promise<void> => {
  const message = await GetHandleTestFailedMessage.getHandleTestFailedMessage(file, relativeDirName, relativeFilePath, fileName, error)
  await HandleTestStateChange.handleTestStateChange(message)
  if (StdinDataState.isGithubActions()) {
    const end = await StdoutWorker.invoke('Stdout.getGitHubGroupEndMessage')
    await Stdout.write(end)
  }
}
