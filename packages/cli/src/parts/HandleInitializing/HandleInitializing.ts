import { getInitializingMessage } from '../GetInitializingMessage/GetInitializingMessage.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as Stdout from '../Stdout/Stdout.ts'

// TODO use functional approach returning new stdout state property without side effects
export const handleInitializing = async (): Promise<void> => {
  if (StdinDataState.isGithubActions()) {
    return
  }
  StdinDataState.setBuffering(false)
  const message = await getInitializingMessage()
  await Stdout.write(message)
}
