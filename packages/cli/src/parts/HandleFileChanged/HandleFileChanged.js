import * as StartRunning from '../StartRunning/StartRunning.js'
import * as StdinDataState from '../StdinDataState/StdinDataState.js'

export const handleFileChanged = async (file) => {
  console.log('file changed', file)
  // const state = StdinDataState.getState()
  // await StartRunning.startRunning(state.value, /* headlessMode */ true, /* color */ true)
}
