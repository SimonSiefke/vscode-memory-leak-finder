import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.ts'
import { getInitializedMessage } from '../GetInitializedMessage/GetInitializedMessage.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import { isWindows } from '../StdinDataState/StdinDataState.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as TestStateOutput from '../TestStateOutput/TestStateOutput.ts'

// TODO use functional approach returning new stdout state property without side effects
export const handleInitialized = async (time: number): Promise<void> => {
  if (StdinDataState.isGithubActions()) {
    return
  }
  const message = await getInitializedMessage(time)
  let fullMessage = ''
  fullMessage += await AnsiEscapes.clear(isWindows())
  fullMessage += message
  fullMessage += TestStateOutput.clearPending()
  await Stdout.write(fullMessage)
}
