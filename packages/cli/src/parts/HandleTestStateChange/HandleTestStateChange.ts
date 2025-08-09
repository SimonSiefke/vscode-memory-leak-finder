import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.ts'
import * as GetTestClearMessage from '../GetTestClearMessage/GetTestClearMessage.ts'
import * as IsGithubActions from '../IsGithubActions/IsGithubActions.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as TestStateOutput from '../TestStateOutput/TestStateOutput.ts'

const getFullMessage = (message: string): string => {
  const clearMessage = GetTestClearMessage.getTestClearMessage()
  let fullMessage = ''
  if (!IsGithubActions.isGithubActions) {
    fullMessage += clearMessage
  }
  fullMessage += message
  if (!IsGithubActions.isGithubActions && !StdinDataState.isBuffering()) {
    fullMessage = AnsiEscapes.clear + fullMessage
  }
  fullMessage += TestStateOutput.clearPending()
  return fullMessage
}

export const handleTestStateChange = async (message: string): Promise<void> => {
  const fullMessage = getFullMessage(message)
  await Stdout.write(fullMessage)
}
