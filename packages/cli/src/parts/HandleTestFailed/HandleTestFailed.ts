import * as HandleTestStateChange from '../HandleTestStateChange/HandleTestStateChange.ts'
import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const handleTestFailed = async (file, relativeDirName, relativeFilePath, fileName, error) => {
  const message = await StdoutWorker.invoke('Stdout.getHandleTestFailedMessage', file, relativeDirName, relativeFilePath, fileName, error)
  await HandleTestStateChange.handleTestStateChange(message)
}
