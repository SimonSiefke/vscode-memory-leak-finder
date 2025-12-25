import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const getHandleTestRunningMessage = async (file: unknown, relativeDirName: unknown, fileName: unknown, isFirst: unknown): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getHandleTestRunningMessage', file, relativeDirName, fileName, isFirst)
}
