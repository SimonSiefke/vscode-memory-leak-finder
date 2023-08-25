import * as GetTestsUnexpectedErrorMessage from '../GetTestsUnexpectedErrorMessage/GetTestsUnexpectedErrorMessage.js'
import * as ModeType from '../ModeType/ModeType.js'
import * as Process from '../Process/Process.js'
import * as StdinDataState from '../StdinDataState/StdinDataState.js'
import * as Stdout from '../Stdout/Stdout.js'

export const handleTestsUnexpectedError = (prettyError) => {
  const isWatchMode = StdinDataState.isWatchMode()
  const message = GetTestsUnexpectedErrorMessage.getTestsUnexpectedErrorMessage(prettyError)
  Stdout.write(message)
  StdinDataState.setState({
    ...StdinDataState.getState(),
    mode: ModeType.FinishedRunning,
  })
  if (!isWatchMode) {
    const exitCode = 129
    // TODO exit naturally
    // TODO dispose worker
    // TODO don't create file watcher worker when not in watch mode
    Process.exit(exitCode)
  }
}
