import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.ts'
import { getInitializedMessage } from '../GetInitializedMessage/GetInitializedMessage.ts'
import { getInitializingMessage } from '../GetInitializingMessage/GetInitializingMessage.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as TestStateOutput from '../TestStateOutput/TestStateOutput.ts'

const getRenderedLineCount = (value: string): number => {
  if (!value) {
    return 0
  }
  const newLineCount = (value.match(/\n/g) || []).length
  if (value.endsWith('\n')) {
    return newLineCount
  }
  return newLineCount + 1
}

const minimumInitializationRowsToClear = 20

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
    const initializationBlock = initializingMessage + capturedOutput
    const renderedLines = getRenderedLineCount(initializationBlock)
    const estimatedRows = initializationBlock.endsWith('\n') ? renderedLines : Math.max(renderedLines - 1, 0)
    const linesToMoveUp = Math.max(estimatedRows, minimumInitializationRowsToClear)
    if (linesToMoveUp > 0) {
      fullMessage += await AnsiEscapes.cursorUp(linesToMoveUp)
    }
    fullMessage += '\r'
    fullMessage += await AnsiEscapes.eraseDown()
  } else if (StdinDataState.isWatchMode()) {
    fullMessage += await AnsiEscapes.clear(StdinDataState.isWindows())
  }
  fullMessage += message
  fullMessage += capturedOutput
  StdinDataState.setCaptureInitializationOutput(false)
  await Stdout.write(fullMessage)
}
