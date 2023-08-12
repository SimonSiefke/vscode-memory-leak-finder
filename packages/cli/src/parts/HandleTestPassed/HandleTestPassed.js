import * as GetHandleTestPassedMessage from '../GetHandleTestPassedMessage/GetHandleTestPassedMessage.js'
import * as HandleTestStateChange from '../HandleTestStateChange/HandleTestStateChange.js'

export const handleTestPassed = (file, relativeDirName, fileName, duration, result) => {
  const message = GetHandleTestPassedMessage.getHandleTestPassedMessage(file, relativeDirName, fileName, duration)
  HandleTestStateChange.handleTestStateChange(message)
}
