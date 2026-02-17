import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as TestStateOutput from '../TestStateOutput/TestStateOutput.ts'

export const handleStdoutData = async (data: Buffer): Promise<void> => {
  const buffering = StdinDataState.isBuffering()
  if (!buffering) {
    await Stdout.write(data.toString())
    return
  }
  TestStateOutput.addStdout(data)
}
