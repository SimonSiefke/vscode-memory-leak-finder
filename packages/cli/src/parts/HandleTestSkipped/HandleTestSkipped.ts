import * as GetHandleTestSkippedMessage from '../GetHandleTestSkippedMessage/GetHandleTestSkippedMessage.ts'
import * as HandleTestStateChange from '../HandleTestStateChange/HandleTestStateChange.ts'

export const handleTestSkipped = async (file: string, relativeDirName: string, fileName: string, duration: number): Promise<void> => {
  const message = await GetHandleTestSkippedMessage.getHandleTestSkippedMessage(file, relativeDirName, fileName, duration)
  await HandleTestStateChange.handleTestStateChange(message)
}
