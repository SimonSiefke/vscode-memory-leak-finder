import * as StdinDataState from '../StdinDataState/StdinDataState.ts'

export const handleTestsStarting = (total) => {
  const isBuffering = total !== 1
  StdinDataState.setBuffering(isBuffering)
}
