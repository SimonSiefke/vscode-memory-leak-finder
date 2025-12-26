import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

<<<<<<< HEAD
export const getHandleTestFailedMessage = (file: unknown, relativeDirName: unknown, relativeFilePath: unknown, fileName: unknown, error: unknown, wasOriginallySkipped: unknown) => {
=======
export const getHandleTestFailedMessage = (
  file: unknown,
  relativeDirName: unknown,
  relativeFilePath: unknown,
  fileName: unknown,
  error: unknown,
  wasOriginallySkipped: unknown,
) => {
>>>>>>> origin/main
  return StdoutWorker.invoke(
    'Stdout.getHandleTestFailedMessage',
    file,
    relativeDirName,
    relativeFilePath,
    fileName,
    error,
    wasOriginallySkipped,
  )
}
