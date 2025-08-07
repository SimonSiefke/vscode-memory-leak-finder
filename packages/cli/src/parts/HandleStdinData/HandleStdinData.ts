import * as GetNewStdinState from '../GetNewStdinState/GetNewStdinState.ts'
import * as HandleExit from '../HandleExit/HandleExit.ts'
import * as KillWorkers from '../KillWorkers/KillWorkers.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as StartRunning from '../StartRunning/StartRunning.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'

export const handleStdinData = async (key) => {
  const state = StdinDataState.getState()
  const newState = await GetNewStdinState.getNewStdinState(state, key)
  if (newState === state) {
    return
  }
  if (newState.mode === ModeType.Exit) {
    return HandleExit.handleExit()
  }
  StdinDataState.setState(newState)
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
    )
  }
  if (newState.mode === ModeType.Interrupted) {
    KillWorkers.killWorkers()
  }
}
