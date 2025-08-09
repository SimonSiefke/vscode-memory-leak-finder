import * as GetHandleTestSkippedMessage from '../GetHandleTestSkippedMessage/GetHandleTestSkippedMessage.ts'
import * as HandleTestStateChange from '../HandleTestStateChange/HandleTestStateChange.ts'

export const handleTestSkipped = (file: string, relativeDirName: string, fileName: string, duration: number): void => {
  const message = GetHandleTestSkippedMessage.getHandleTestSkippedMessage(file, relativeDirName, fileName, duration)
  HandleTestStateChange.handleTestStateChange(message)
}
