import * as ExitCode from '../ExitCode/ExitCode.ts'
import * as GetTestsUnexpectedErrorMessage from '../GetTestsUnexpectedErrorMessage/GetTestsUnexpectedErrorMessage.ts'
import * as HandleExit from '../HandleExit/HandleExit.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as TestStateOutput from '../TestStateOutput/TestStateOutput.ts'

export const handleTestsUnexpectedError = async (prettyError: unknown): Promise<void> => {
  const message = await GetTestsUnexpectedErrorMessage.getTestsUnexpectedErrorMessage(prettyError)
  const fullMessage = TestStateOutput.clearPending() + message
  await Stdout.write(fullMessage)
  const state = StdinDataState.getState()
  StdinDataState.setState({
    ...state,
    exitCode: ExitCode.UnexpectedTestError,
    mode: ModeType.FinishedRunning,
  })
  process.exitCode = ExitCode.UnexpectedTestError
  await HandleExit.handleExit()
}
