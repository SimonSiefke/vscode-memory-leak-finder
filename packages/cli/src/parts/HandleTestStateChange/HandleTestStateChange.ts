import * as IsGithubActions from '../IsGithubActions/IsGithubActions.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'
import * as TestStateOutput from '../TestStateOutput/TestStateOutput.ts'

const getFullMessage = async (message: string): Promise<string> => {
  const clearMessage = await StdoutWorker.invoke('Stdout.getTestClearMessage')
  let fullMessage = ''
  if (!IsGithubActions.isGithubActions) {
    fullMessage += clearMessage
  }
  fullMessage += message
  if (!IsGithubActions.isGithubActions && !StdinDataState.isBuffering()) {
    const clear = await StdoutWorker.invoke('Stdout.getClear')
    fullMessage = clear + fullMessage
  }
  fullMessage += TestStateOutput.clearPending()
  return fullMessage
}

export const handleTestStateChange = async (message: string): Promise<void> => {
  const fullMessage = await getFullMessage(message)
  await Stdout.write(fullMessage)
}
