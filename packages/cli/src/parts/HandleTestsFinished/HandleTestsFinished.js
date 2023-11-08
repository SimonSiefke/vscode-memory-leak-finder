import * as Assert from '../Assert/Assert.js'
import * as GetAllTestsFinishedMessage from '../GetAllTestsFinishedMessage/GetAllTestsFinishedMessage.js'
import * as HandleExit from '../HandleExit/HandleExit.js'
import * as ModeType from '../ModeType/ModeType.js'
import * as StdinDataState from '../StdinDataState/StdinDataState.js'
import * as Stdout from '../Stdout/Stdout.js'

export const handleTestsFinished = (passed, failed, skipped, leaked, total, duration, filterValue) => {
  Assert.number(passed)
  Assert.number(failed)
  Assert.number(skipped)
  Assert.number(leaked)
  Assert.number(total)
  Assert.number(duration)
  Assert.string(filterValue)
  const isWatchMode = StdinDataState.isWatchMode()
  const message = GetAllTestsFinishedMessage.getAllTestsFinishedMessage(
    passed,
    failed,
    skipped,
    leaked,
    total,
    duration,
    filterValue,
    isWatchMode,
  )
  Stdout.write(message)
  StdinDataState.setState({
    ...StdinDataState.getState(),
    mode: ModeType.FinishedRunning,
  })
  if (!isWatchMode) {
    if (failed) {
      process.exitCode = 1
    }
    HandleExit.handleExit()
  }
}
