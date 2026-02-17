import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as TestStateOutput from '../TestStateOutput/TestStateOutput.ts'

export const handleStderrData = async (data: Buffer): Promise<void> => {
  const buffering = StdinDataState.isBuffering()
  const captureInitializationOutput = StdinDataState.shouldCaptureInitializationOutput()
  if (!buffering) {
    await Stdout.write(data.toString()) // TODO use stderr
  }
  if (buffering || captureInitializationOutput) {
    TestStateOutput.addStdErr(data)
  }
}
