import { getInitializingMessage } from '../GetInitializingMessage/GetInitializingMessage.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as TestStateOutput from '../TestStateOutput/TestStateOutput.ts'

// TODO use functional approach returning new stdout state property without side effects
export const handleInitializing = async (): Promise<void> => {
  if (StdinDataState.isGithubActions()) {
    return
  }
  TestStateOutput.clearPending()
  StdinDataState.setCaptureInitializationOutput(true)
  StdinDataState.setBuffering(false)
  const message = await getInitializingMessage()
  await Stdout.write(message)
}
