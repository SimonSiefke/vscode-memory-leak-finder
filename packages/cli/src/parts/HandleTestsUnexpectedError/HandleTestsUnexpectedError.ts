import * as ExitCode from '../ExitCode/ExitCode.ts'
import * as GetTestsUnexpectedErrorMessage from '../GetTestsUnexpectedErrorMessage/GetTestsUnexpectedErrorMessage.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as Process from '../Process/Process.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as TestStateOutput from '../TestStateOutput/TestStateOutput.ts'

export const handleTestsUnexpectedError = async (prettyError) => {
  const isWatchMode = StdinDataState.isWatchMode()
  const message = await GetTestsUnexpectedErrorMessage.getTestsUnexpectedErrorMessage(prettyError)
  const fullMessage = TestStateOutput.clearPending() + message
  await Stdout.write(fullMessage)
  StdinDataState.setState({
    ...StdinDataState.getState(),
    mode: ModeType.FinishedRunning,
  })
  if (!isWatchMode) {
    // TODO exit naturally
    // TODO dispose worker
    // TODO don't create file watcher worker when not in watch mode
    Process.exit(ExitCode.UnexpectedTestError)
  }
}
