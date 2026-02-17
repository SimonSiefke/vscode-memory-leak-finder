import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as TestStateOutput from '../TestStateOutput/TestStateOutput.ts'

export const handleStdoutData = async (data: Buffer): Promise<void> => {
  const buffering = StdinDataState.isBuffering()
  const captureInitializationOutput = StdinDataState.shouldCaptureInitializationOutput()
  if (!buffering) {
    await Stdout.write(data.toString())
  }
  if (buffering || captureInitializationOutput) {
    TestStateOutput.addStdout(data)
  }
}
