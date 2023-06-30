import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.js'
import * as GetTestClearMessage from '../GetTestClearMessage/GetTestClearMessage.js'
import * as StdinDataState from '../StdinDataState/StdinDataState.js'
import * as Stdout from '../Stdout/Stdout.js'
import * as TestStateOutput from '../TestStateOutput/TestStateOutput.js'

const getFullMessage = (message) => {
  const clearMessage = GetTestClearMessage.getTestClearMessage()
  let fullMessage = clearMessage + message
  if (!StdinDataState.isBuffering()) {
    fullMessage = AnsiEscapes.clear + fullMessage
  }
  fullMessage += TestStateOutput.clearPending()
  return fullMessage
}

export const handleTestStateChange = (message) => {
  const fullMessage = getFullMessage(message)
  Stdout.write(fullMessage)
}
