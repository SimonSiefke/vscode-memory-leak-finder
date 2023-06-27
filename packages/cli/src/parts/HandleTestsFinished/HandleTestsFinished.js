import * as GetAllTestsFinishedMessage from '../GetAllTestsFinishedMessage/GetAllTestsFinishedMessage.js'
import * as ModeType from '../ModeType/ModeType.js'
import * as StdinDataState from '../StdinDataState/StdinDataState.js'
import * as Stdout from '../Stdout/Stdout.js'

export const handleTestsFinished = (passed, failed, skipped, total, duration, filterValue) => {
  const message = GetAllTestsFinishedMessage.getAllTestsFinishedMessage(passed, failed, skipped, total, duration, filterValue)
  Stdout.write(message)
  StdinDataState.setState({
    ...StdinDataState.getState(),
    mode: ModeType.FinishedRunning,
  })
}
