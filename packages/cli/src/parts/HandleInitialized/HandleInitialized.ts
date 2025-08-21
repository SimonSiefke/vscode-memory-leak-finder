import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.ts'
import { getInitializedMessage } from '../GetInitializedMessage/GetInitializedMessage.ts'
import { isGithubActions, isWindows } from '../StdinDataState/StdinDataState.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as TestStateOutput from '../TestStateOutput/TestStateOutput.ts'

// TODO use functional approach returning new stdout state property without side effects
export const handleInitialized = async (time: number): Promise<void> => {
  const isGithub = isGithubActions()
  const message = await getInitializedMessage(time)
  let fullMessage = ''
  if (!isGithub) {
    fullMessage += await AnsiEscapes.clear(isWindows())
  }
  fullMessage += message
  fullMessage += TestStateOutput.clearPending()
  await Stdout.write(fullMessage)
}
