import * as GetHandleTestPassedMessage from '../GetHandleTestPassedMessage/GetHandleTestPassedMessage.ts'
import * as HandleTestStateChange from '../HandleTestStateChange/HandleTestStateChange.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'
import * as Stdout from '../Stdout/Stdout.ts'

export const handleTestPassed = async (
  file: string,
  relativeDirName: string,
  fileName: string,
  duration: number,
  isLeak: boolean,
): Promise<void> => {
  const message = await GetHandleTestPassedMessage.getHandleTestPassedMessage(file, relativeDirName, fileName, duration, isLeak)
  await HandleTestStateChange.handleTestStateChange(message)
  if (StdinDataState.isGithubActions()) {
    const end = await StdoutWorker.invoke('Stdout.getGitHubGroupEndMessage')
    await Stdout.write(end)
  }
}
