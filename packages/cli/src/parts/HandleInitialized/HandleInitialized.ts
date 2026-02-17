import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.ts'
import { getInitializedMessage } from '../GetInitializedMessage/GetInitializedMessage.ts'
import { getInitializingMessage } from '../GetInitializingMessage/GetInitializingMessage.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as TestStateOutput from '../TestStateOutput/TestStateOutput.ts'

const countRenderedLines = (text: string): number => {
  if (!text) {
    return 0
  }
  return text.split('\n').length - (text.endsWith('\n') ? 1 : 0)
}

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
    const initializingMessage = await getInitializingMessage()
    const linesToClear = countRenderedLines(initializingMessage + capturedOutput)
    if (linesToClear > 0) {
      fullMessage += await AnsiEscapes.cursorUp(linesToClear)
      fullMessage += await AnsiEscapes.eraseDown()
    }
  } else if (StdinDataState.isWatchMode()) {
    fullMessage += await AnsiEscapes.clear(StdinDataState.isWindows())
  }
  fullMessage += message
  fullMessage += capturedOutput
  StdinDataState.setCaptureInitializationOutput(false)
  await Stdout.write(fullMessage)
}
