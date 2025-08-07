import * as StdinDataState from '../StdinDataState/StdinDataState.js'

export const handleTestsStarting = (total) => {
  const isBuffering = total !== 1
  StdinDataState.setBuffering(isBuffering)
}
