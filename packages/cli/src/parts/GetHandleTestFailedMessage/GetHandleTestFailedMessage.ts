import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const getHandleTestFailedMessage = (file, relativeDirName, relativeFilePath, fileName, error) => {
  return StdoutWorker.invoke('Stdout.getHandleTestFailedMessage', file, relativeDirName, relativeFilePath, fileName, error)
}
