import * as GetNewStdinState from '../GetNewStdinState/GetNewStdinState.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as UpdateState from '../UpdateState/UpdateState.ts'

export const handleStdinData = async (key: string): Promise<void> => {
  const state = StdinDataState.getState()
  const newState = await GetNewStdinState.getNewStdinState(state, key)
  await UpdateState.updateState(newState)
}
