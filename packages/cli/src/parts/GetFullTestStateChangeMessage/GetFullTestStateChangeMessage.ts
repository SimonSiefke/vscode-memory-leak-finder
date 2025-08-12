import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.ts'
import * as GetTestClearMessage from '../GetTestClearMessage/GetTestClearMessage.ts'
import * as TestStateOutput from '../TestStateOutput/TestStateOutput.ts'

export const getFullMessage = async (
  message: string,
  isGithubAcions: boolean,
  isBuffering: boolean,
  isWindows: boolean,
): Promise<string> => {
  const clearMessage = await GetTestClearMessage.getTestClearMessage()
  let fullMessage = ''
  if (!isGithubAcions) {
    fullMessage += clearMessage
  }
  fullMessage += message
  if (!isGithubAcions && !isBuffering) {
    const clear = await AnsiEscapes.clear(isWindows)
    fullMessage = clear + '\n' + fullMessage
  }
  fullMessage += TestStateOutput.clearPending()
  return fullMessage
}
