import * as StdinDataState from '../StdinDataState/StdinDataState.js'
import * as Stdout from '../Stdout/Stdout.js'
import * as TestStateOutput from '../TestStateOutput/TestStateOutput.js'

export const handleStdoutData = (data) => {
  if (!StdinDataState.isBuffering()) {
    Stdout.write(data)
  }
  TestStateOutput.addStdout(data)
}
