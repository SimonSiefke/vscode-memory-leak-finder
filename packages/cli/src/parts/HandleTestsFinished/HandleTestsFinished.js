import * as GetAllTestsFinishedMessage from '../GetAllTestsFinishedMessage/GetAllTestsFinishedMessage.js'
import * as ModeType from '../ModeType/ModeType.js'
import * as Process from '../Process/Process.js'
import * as StdinDataState from '../StdinDataState/StdinDataState.js'
import * as Stdout from '../Stdout/Stdout.js'

export const handleTestsFinished = (passed, failed, skipped, total, duration, filterValue) => {
  const isWatchMode = StdinDataState.isWatchMode()
  const message = GetAllTestsFinishedMessage.getAllTestsFinishedMessage(passed, failed, skipped, total, duration, filterValue, isWatchMode)
  Stdout.write(message)
  StdinDataState.setState({
    ...StdinDataState.getState(),
    mode: ModeType.FinishedRunning,
  })
  if (!isWatchMode) {
    const exitCode = failed ? 1 : 0
    // TODO exit naturally
    // TODO dispose worker
    // TODO don't create file watcher worker when not in watch mode
    Process.exit(exitCode)
  }
}
