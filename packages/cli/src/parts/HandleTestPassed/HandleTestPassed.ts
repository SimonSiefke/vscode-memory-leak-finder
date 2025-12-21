import * as GetHandleTestPassedMessage from '../GetHandleTestPassedMessage/GetHandleTestPassedMessage.ts'
import * as HandleTestStateChange from '../HandleTestStateChange/HandleTestStateChange.ts'

export const handleTestPassed = async (
  file: string,
  relativeDirName: string,
  fileName: string,
  duration: number,
  isLeak: boolean,
  wasOriginallySkipped: boolean,
): Promise<void> => {
  const message = await GetHandleTestPassedMessage.getHandleTestPassedMessage(
    file,
    relativeDirName,
    fileName,
    duration,
    isLeak,
    wasOriginallySkipped,
  )
  await HandleTestStateChange.handleTestStateChange(message)
}
