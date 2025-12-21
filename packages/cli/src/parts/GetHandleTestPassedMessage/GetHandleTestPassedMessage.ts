import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const getHandleTestPassedMessage = async (
  file: string,
  relativeDirName: string,
  fileName: string,
  duration: number,
  isLeak: boolean,
  wasOriginallySkipped: boolean,
): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getHandleTestPassedMessage', file, relativeDirName, fileName, duration, isLeak, wasOriginallySkipped)
}
