import * as Assert from '../Assert/Assert.ts'
import * as ExitCode from '../ExitCode/ExitCode.ts'
import * as HandleExit from '../HandleExit/HandleExit.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const handleTestsFinished = async (
  passed: number,
  failed: number,
  skipped: number,
  leaked: number,
  total: number,
  duration: number,
  filterValue: string,
): Promise<void> => {
  Assert.number(passed)
  Assert.number(failed)
  Assert.number(skipped)
  Assert.number(leaked)
  Assert.number(total)
  Assert.number(duration)
  Assert.string(filterValue)
  const isWatchMode = StdinDataState.isWatchMode()
  const message = await StdoutWorker.invoke(
    'Stdout.getAllTestsFinishedMessage',
    passed,
    failed,
    skipped,
    leaked,
    total,
    duration,
    filterValue,
    isWatchMode,
  )
  await Stdout.write(message)
  StdinDataState.setState({
    ...StdinDataState.getState(),
    mode: ModeType.FinishedRunning,
  })
  if (!isWatchMode) {
    if (failed) {
      process.exitCode = ExitCode.Error
    }
    HandleExit.handleExit()
  }
}
