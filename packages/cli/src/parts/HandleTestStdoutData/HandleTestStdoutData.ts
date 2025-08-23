import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as TestStateOutput from '../TestStateOutput/TestStateOutput.ts'

export const handleStdoutData = async (data) => {
  if (!StdinDataState.isBuffering()) {
    await Stdout.write(data.toString())
  }
  TestStateOutput.addStdout(data)
}
