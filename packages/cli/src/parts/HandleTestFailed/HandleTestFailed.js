import * as GetHandleTestFailedMessage from '../GetHandleTestFailedMessage/GetHandleTestFailedMessage.js'
import * as HandleTestStateChange from '../HandleTestStateChange/HandleTestStateChange.js'

export const handleTestFailed = (file, relativeDirName, relativeFilePath, fileName, error) => {
  const message = GetHandleTestFailedMessage.getHandleTestFailedMessage(file, relativeDirName, relativeFilePath, fileName, error)
  HandleTestStateChange.handleTestStateChange(message)
}
