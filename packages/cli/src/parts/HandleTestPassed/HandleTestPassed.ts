import * as GetHandleTestPassedMessage from '../GetHandleTestPassedMessage/GetHandleTestPassedMessage.ts'
import * as HandleTestStateChange from '../HandleTestStateChange/HandleTestStateChange.ts'

export const handleTestPassed = (file, relativeDirName, fileName, duration, isLeak) => {
  const message = GetHandleTestPassedMessage.getHandleTestPassedMessage(file, relativeDirName, fileName, duration, isLeak)
  HandleTestStateChange.handleTestStateChange(message)
}
