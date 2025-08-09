import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const getHandleTestRunningMessage = async (file, relativeDirName, fileName, isFirst): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getHandleTestRunningMessage', file, relativeDirName, fileName, isFirst)
}
