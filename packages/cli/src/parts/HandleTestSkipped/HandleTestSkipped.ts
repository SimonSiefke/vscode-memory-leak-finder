import * as GetHandleTestSkippedMessage from '../GetHandleTestSkippedMessage/GetHandleTestSkippedMessage.ts'
import * as HandleTestStateChange from '../HandleTestStateChange/HandleTestStateChange.ts'

export const handleTestSkipped = (file, relativeDirName, fileName, duration) => {
  const message = GetHandleTestSkippedMessage.getHandleTestSkippedMessage(file, relativeDirName, fileName, duration)
  HandleTestStateChange.handleTestStateChange(message)
}
