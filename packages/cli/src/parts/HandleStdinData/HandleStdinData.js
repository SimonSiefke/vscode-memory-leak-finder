import * as Character from '../Character/Character.js'
import * as GetNewStdinState from '../GetNewStdinState/GetNewStdinState.js'
import * as HandleExit from '../HandleExit/HandleExit.js'
import * as ModeType from '../ModeType/ModeType.js'
import * as StartRunning from '../StartRunning/StartRunning.js'
import * as Stdin from '../Stdin/Stdin.js'
import * as StdinDataState from '../StdinDataState/StdinDataState.js'
import * as Stdout from '../Stdout/Stdout.js'

export const handleStdinData = async (key) => {
  const state = StdinDataState.getState()
  const newState = GetNewStdinState.getNewStdinState(state, key)
  if (newState === state) {
    return
  }
  if (newState.mode === ModeType.Exit) {
    Stdin.setRawMode(false)
    Stdout.write(Character.NewLine)
    await HandleExit.handleExit()
    return
  }
  StdinDataState.setState(newState)
  if (newState.mode === ModeType.Running) {
    await StartRunning.startRunning(state.value, /* headlessMode */ true, /* color */ true)
  }
}
