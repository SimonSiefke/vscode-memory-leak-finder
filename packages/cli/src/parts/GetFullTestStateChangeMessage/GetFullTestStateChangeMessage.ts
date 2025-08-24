import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.ts'
import * as GetTestClearMessage from '../GetTestClearMessage/GetTestClearMessage.ts'
import * as TestStateOutput from '../TestStateOutput/TestStateOutput.ts'

export const getFullMessage = async (
  message: string,
  isGithubActions: boolean,
  isBuffering: boolean,
  isWindows: boolean,
): Promise<string> => {
  const clearMessage = await GetTestClearMessage.getTestClearMessage()
  let fullMessage = ''
  if (!isGithubActions) {
    fullMessage += clearMessage
  }
  if (isGithubActions) {
    const title: string = message.split('\n')[0]
    fullMessage += `::group::${title}\n`
  }
  fullMessage += message
  if (!isGithubActions && !isBuffering) {
    const clear = await AnsiEscapes.clear(isWindows)
    fullMessage = clear + fullMessage
  }
  fullMessage += TestStateOutput.clearPending()
  if (isGithubActions) {
    fullMessage += `::endgroup::\n`
  }
  return fullMessage
}
