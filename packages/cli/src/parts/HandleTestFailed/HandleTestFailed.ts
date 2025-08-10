import * as GetHandleTestFailedMessage from '../GetHandleTestFailedMessage/GetHandleTestFailedMessage.ts'
import * as HandleTestStateChange from '../HandleTestStateChange/HandleTestStateChange.ts'

export const handleTestFailed = async (file, relativeDirName, relativeFilePath, fileName, error) => {
  const message = await GetHandleTestFailedMessage.getHandleTestFailedMessage(file, relativeDirName, relativeFilePath, fileName, error)
  await HandleTestStateChange.handleTestStateChange(message)
}
