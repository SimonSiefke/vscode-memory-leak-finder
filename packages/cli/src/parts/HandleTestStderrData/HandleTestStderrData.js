import * as StdinDataState from '../StdinDataState/StdinDataState.js'
import * as Stdout from '../Stdout/Stdout.js'
import * as TestStateOutput from '../TestStateOutput/TestStateOutput.js'

export const handleStderrData = async (data) => {
  if (!StdinDataState.isBuffering()) {
    await Stdout.write(data.toString()) // TODO use stderr
  }
  TestStateOutput.addStdErr(data)
}
