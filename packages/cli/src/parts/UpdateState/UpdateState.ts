import * as HandleExit from '../HandleExit/HandleExit.ts'
import * as KillWorkers from '../KillWorkers/KillWorkers.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as PreviousFilters from '../PreviousFilters/PreviousFilters.ts'
import * as StartRunning from '../StartRunning/StartRunning.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as Stdout from '../Stdout/Stdout.ts'

export const updateState = async (newState: any): Promise<void> => {
  const state = StdinDataState.getState()
  if (newState === state) {
    return
  }
  if (newState.stdout && newState.stdout.length > 0) {
    await Stdout.write(newState.stdout.join(''))
  }
  if (newState.previousFilters.length > 0) {
    await PreviousFilters.addAll(newState.previousFilters)
  }
  if (newState.mode === ModeType.Exit || newState.mode === ModeType.FinishedRunning) {
    return HandleExit.handleExit()
  }
  StdinDataState.setState({ ...newState, stdout: [], previousFilters: [] })
  if (state.mode !== ModeType.Running && newState.mode === ModeType.Running) {
    await StartRunning.startRunning({
      filterValue: state.value,
      headlessMode: state.headless,
      color: true,
      checkLeaks: state.checkLeaks,
      recordVideo: state.recordVideo,
      cwd: state.cwd,
      runs: state.runs,
      measure: state.measure,
      measureAfter: state.measureAfter,
      timeouts: state.timeouts,
      timeoutBetween: state.timeoutBetween,
      restartBetween: state.restartBetween,
      runMode: state.runMode,
      ide: state.ide,
      ideVersion: state.ideVersion,
      vscodePath: '',
      commit: '',
      setupOnly: false,
      workers: state.workers,
      isWindows: state.isWindows,
    })
  }
  if (newState.mode === ModeType.Interrupted) {
    await KillWorkers.killWorkers()
  }
}
