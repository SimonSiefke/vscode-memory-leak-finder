import * as StartRunning from '../StartRunning/StartRunning.js'
import * as StdinDataState from '../StdinDataState/StdinDataState.js'

export const handleFileChanged = async () => {
  const state = StdinDataState.getState()
  await StartRunning.startRunning(state.value, /* headlessMode */ true, /* color */ true)
}
