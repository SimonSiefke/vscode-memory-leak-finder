import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const getHandleTestFailedMessage = (
  file: unknown,
  relativeDirName: unknown,
  relativeFilePath: unknown,
  fileName: unknown,
  error: unknown,
  wasOriginallySkipped: unknown,
) => {
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
