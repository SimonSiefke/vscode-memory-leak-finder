import * as GetHandleTestSetupMessage from '../GetHandleTestSetupMessage/GetHandleTestSetupMessage.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'

export const handleTestSetup = async (): Promise<void> => {
  if (StdinDataState.isGithubActions()) {
    return
  }
  const message = await GetHandleTestSetupMessage.getHandleTestSetupMessage()
  await Stdout.write(message)
}
