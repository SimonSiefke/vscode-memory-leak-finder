import * as IsUnimportantStdoutMessage from '../IsUnimportantStdoutMessage/IsUnimportantStdoutMessage.js'
import * as StdinDataState from '../StdinDataState/StdinDataState.js'
import * as Stdout from '../Stdout/Stdout.js'
import * as TestStateOutput from '../TestStateOutput/TestStateOutput.js'

export const handleStdoutData = (data) => {
  if (IsUnimportantStdoutMessage.isUnimportantStdoutMessage(data.toString())) {
    return
  }
  if (StdinDataState.isBuffering()) {
    TestStateOutput.addStdout(data)
  } else {
    Stdout.write(data)
  }
}
