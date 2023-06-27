import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.js'
import * as StdinDataState from '../StdinDataState/StdinDataState.js'
import * as Stdout from '../Stdout/Stdout.js'
import * as TestStateOutput from '../TestStateOutput/TestStateOutput.js'

export const handleTestStateChange = (message) => {
  let fullMessage = message
  if (!StdinDataState.isBuffering()) {
    fullMessage = AnsiEscapes.clear + fullMessage
  }
  fullMessage += TestStateOutput.clearPending()
  Stdout.write(fullMessage)
}
