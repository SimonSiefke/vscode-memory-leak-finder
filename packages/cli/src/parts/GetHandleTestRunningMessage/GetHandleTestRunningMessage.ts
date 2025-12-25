import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

<<<<<<< HEAD
export const getHandleTestRunningMessage = async (file: unknown, relativeDirName: unknown, fileName: unknown, isFirst: unknown): Promise<string> => {
=======
export const getHandleTestRunningMessage = async (
  file: unknown,
  relativeDirName: unknown,
  fileName: unknown,
  isFirst: unknown,
): Promise<string> => {
>>>>>>> origin/main
  return StdoutWorker.invoke('Stdout.getHandleTestRunningMessage', file, relativeDirName, fileName, isFirst)
}
