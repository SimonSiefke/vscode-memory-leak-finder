import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.ts'
import * as GetTestClearMessage from '../GetTestClearMessage/GetTestClearMessage.ts'
import * as TestStateOutput from '../TestStateOutput/TestStateOutput.ts'

export const getFullMessage = async (
  message: string,
  isGithubActions: boolean,
  isBuffering: boolean,
  isWindows: boolean,
  isWatchMode: boolean,
): Promise<string> => {
  let fullMessage = ''
  if (isWatchMode && !isGithubActions) {
    const clearMessage = await GetTestClearMessage.getTestClearMessage()
    fullMessage += clearMessage
  }
  fullMessage += message
  if (isWatchMode && !isGithubActions && !isBuffering) {
    const clear = await AnsiEscapes.clear(isWindows)
    fullMessage = clear + fullMessage
  }
  fullMessage += TestStateOutput.clearPending()
  return fullMessage
}
