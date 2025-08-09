import * as GetHandleTestPassedMessage from '../GetHandleTestPassedMessage/GetHandleTestPassedMessage.ts'
import * as HandleTestStateChange from '../HandleTestStateChange/HandleTestStateChange.ts'

export const handleTestPassed = (file: string, relativeDirName: string, fileName: string, duration: number, isLeak: boolean): void => {
  const message = GetHandleTestPassedMessage.getHandleTestPassedMessage(file, relativeDirName, fileName, duration, isLeak)
  HandleTestStateChange.handleTestStateChange(message)
}
