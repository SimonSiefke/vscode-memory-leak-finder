import * as GetNewStdinState from '../GetNewStdinState/GetNewStdinState.js'
import * as HandleExit from '../HandleExit/HandleExit.js'
import * as KillWorkers from '../KillWorkers/KillWorkers.js'
import * as ModeType from '../ModeType/ModeType.js'
import * as StartRunning from '../StartRunning/StartRunning.js'
import * as StdinDataState from '../StdinDataState/StdinDataState.js'

export const handleStdinData = async (key) => {
  const state = StdinDataState.getState()
  const newState = GetNewStdinState.getNewStdinState(state, key)
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
    )
  }
  if (newState.mode === ModeType.Interrupted) {
    KillWorkers.killWorkers()
  }
}
