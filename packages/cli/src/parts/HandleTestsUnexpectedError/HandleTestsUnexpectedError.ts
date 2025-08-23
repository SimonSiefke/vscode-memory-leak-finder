import * as GetTestsUnexpectedErrorMessage from '../GetTestsUnexpectedErrorMessage/GetTestsUnexpectedErrorMessage.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as TestStateOutput from '../TestStateOutput/TestStateOutput.ts'
import { updateState } from '../UpdateState/UpdateState.ts'

export const handleTestsUnexpectedError = async (prettyError) => {
  const message = await GetTestsUnexpectedErrorMessage.getTestsUnexpectedErrorMessage(prettyError)
  const fullMessage = TestStateOutput.clearPending() + message
  const state = StdinDataState.getState()
  const newState = {
    ...state,
    stdout: [...state.stdout, fullMessage],
    mode: ModeType.FinishedRunning,
  }
  await updateState(newState)
}
