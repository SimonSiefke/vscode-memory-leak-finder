import * as IsUnimportantStdoutMessage from '../IsUnimportantStdoutMessage/IsUnimportantStdoutMessage.js'
import * as StdinDataState from '../StdinDataState/StdinDataState.js'
import * as Stdout from '../Stdout/Stdout.js'
import * as TestStateOutput from '../TestStateOutput/TestStateOutput.js'

export const handleStdoutData = async (data) => {
  if (IsUnimportantStdoutMessage.isUnimportantStdoutMessage(data.toString())) {
    return
  }
  if (!StdinDataState.isBuffering()) {
    await Stdout.write(data)
  }
  TestStateOutput.addStdout(data)
}
