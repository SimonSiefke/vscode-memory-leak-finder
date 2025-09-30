import * as GetHandleTestFailedMessage from '../GetHandleTestFailedMessage/GetHandleTestFailedMessage.ts'
import * as HandleTestStateChange from '../HandleTestStateChange/HandleTestStateChange.ts'

export const handleTestFailed = async (
  file: string,
  relativeDirName: string,
  relativeFilePath: string,
  fileName: string,
  error: any,
  wasOriginallySkipped: boolean,
): Promise<void> => {
  const message = await GetHandleTestFailedMessage.getHandleTestFailedMessage(file, relativeDirName, relativeFilePath, fileName, error, wasOriginallySkipped)
  await HandleTestStateChange.handleTestStateChange(message)
}
