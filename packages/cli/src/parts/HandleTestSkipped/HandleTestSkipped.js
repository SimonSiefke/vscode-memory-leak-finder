import * as GetHandleTestSkippedMessage from '../GetHandleTestSkippedMessage/GetHandleTestSkippedMessage.js'
import * as HandleTestStateChange from '../HandleTestStateChange/HandleTestStateChange.js'

export const handleTestSkipped = (file, relativeDirName, fileName, duration) => {
  const message = GetHandleTestSkippedMessage.getHandleTestSkippedMessage(file, relativeDirName, fileName, duration)
  HandleTestStateChange.handleTestStateChange(message)
}
