import { getFullMessage } from '../GetFullTestStateChangeMessage/GetFullTestStateChangeMessage.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as Stdout from '../Stdout/Stdout.ts'

export const handleTestStateChange = async (message: string): Promise<void> => {
  const fullMessage = await getFullMessage(
    message,
    StdinDataState.isGithubActions(),
    StdinDataState.isBuffering(),
    StdinDataState.isWindows(),
  )
  await Stdout.write(fullMessage)
}
