import * as GetHandleTestFailedMessage from '../GetHandleTestFailedMessage/GetHandleTestFailedMessage.ts'
import * as HandleTestStateChange from '../HandleTestStateChange/HandleTestStateChange.ts'

export const handleTestFailed = (file, relativeDirName, relativeFilePath, fileName, error) => {
  const message = GetHandleTestFailedMessage.getHandleTestFailedMessage(file, relativeDirName, relativeFilePath, fileName, error)
  HandleTestStateChange.handleTestStateChange(message)
}
