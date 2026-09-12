import * as GetHandleTestFailedMessage from '../GetHandleTestFailedMessage/GetHandleTestFailedMessage.ts'
import * as HandleTestStateChange from '../HandleTestStateChange/HandleTestStateChange.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'

export const handleTestFailed = async (
  file: string,
  relativeDirName: string,
  relativeFilePath: string,
  fileName: string,
  error: any,
  wasOriginallySkipped: boolean,
  duration: number,
): Promise<void> => {
  const message = await GetHandleTestFailedMessage.getHandleTestFailedMessage(
    file,
    relativeDirName,
    relativeFilePath,
    fileName,
    error,
    wasOriginallySkipped,
    duration,
    StdinDataState.shouldShowSkippedFailedTestDuration(),
  )
  await HandleTestStateChange.handleTestStateChange(message)
}
