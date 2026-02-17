import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.ts'
import { getInitializedMessage } from '../GetInitializedMessage/GetInitializedMessage.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as TestStateOutput from '../TestStateOutput/TestStateOutput.ts'

// TODO use functional approach returning new stdout state property without side effects
export const handleInitialized = async (time: number): Promise<void> => {
  if (StdinDataState.isGithubActions()) {
    return
  }
  const capturedOutput = TestStateOutput.clearPending()
  const capturedInitializationOutput = StdinDataState.shouldCaptureInitializationOutput()
  const message = await getInitializedMessage(time)
  let fullMessage = ''
  if (capturedInitializationOutput) {
    fullMessage += await AnsiEscapes.clear(StdinDataState.isWindows())
  } else if (StdinDataState.isWatchMode()) {
    fullMessage += await AnsiEscapes.clear(StdinDataState.isWindows())
  }
  fullMessage += message
  fullMessage += capturedOutput
  StdinDataState.setCaptureInitializationOutput(false)
  await Stdout.write(fullMessage)
}
