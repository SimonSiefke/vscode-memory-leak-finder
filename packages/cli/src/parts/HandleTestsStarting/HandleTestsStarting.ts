import * as StdinDataState from '../StdinDataState/StdinDataState.ts'

export const handleTestsStarting = (total: number): void => {
  const isBuffering = total !== 1
  StdinDataState.setBuffering(isBuffering)
}
