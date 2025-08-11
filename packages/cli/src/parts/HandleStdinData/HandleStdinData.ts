import * as GetNewStdinState from '../GetNewStdinState/GetNewStdinState.ts'
import * as HandleExit from '../HandleExit/HandleExit.ts'
import * as KillWorkers from '../KillWorkers/KillWorkers.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as StartRunning from '../StartRunning/StartRunning.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as Stdout from '../Stdout/Stdout.ts'

export const handleStdinData = async (key: string): Promise<void> => {
  const state = StdinDataState.getState()
  const newState = await GetNewStdinState.getNewStdinState(state, key)
  if (newState === state) {
    return
  }
  if (newState.stdout && newState.stdout.length > 0) {
    await Stdout.write(newState.stdout.join(''))
  }
  if (newState.mode === ModeType.Exit) {
    return HandleExit.handleExit()
  }
  StdinDataState.setState({ ...newState, stdout: [] })
  if (newState.mode === ModeType.Running) {
    await StartRunning.startRunning(
      state.value,
      state.headless,
      /* color */ true,
      state.checkLeaks,
      state.recordVideo,
      state.cwd,
      state.runs,
      state.measure,
      state.measureAfter,
      state.timeouts,
      state.timeoutBetween,
      state.restartBetween,
      state.runMode,
      state.ide,
      state.ideVersion,
      '',
      '',
      false,
      state.workers,
    )
  }
  if (newState.mode === ModeType.Interrupted) {
    await KillWorkers.killWorkers()
  }
}
