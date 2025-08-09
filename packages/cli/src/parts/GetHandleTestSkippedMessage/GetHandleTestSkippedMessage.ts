import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const getHandleTestSkippedMessage = async (
  file: string,
  relativeDirName: string,
  fileName: string,
  duration: number,
): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getHandleTestSkippedMessage', file, relativeDirName, fileName, duration)
}
