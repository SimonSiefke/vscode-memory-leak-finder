import * as HandleStdinDataFilterWaitingMode from '../HandleStdinDataFilterWaitingMode/HandleStdinDataFilterWaitingMode.js'
import * as HandleStdinDataFinishedRunningMode from '../HandleStdinDataFinishedRunningMode/HandleStdinDataFinishedRunningMode.js'
import * as HandleStdinDataInterruptedMode from '../HandleStdinDataInterruptedMode/HandleStdinDataInterruptedMode.js'
import * as HandleStdinDataRunningMode from '../HandleStdinDataRunningMode/HandleStdinDataRunningMode.js'
import * as HandleStdinDataWaitingMode from '../HandleStdinDataWaitingMode/HandleStdinDataWaitingMode.js'
import * as ModeType from '../ModeType/ModeType.js'

export const getFn = (mode) => {
  switch (mode) {
    case ModeType.Waiting:
      return HandleStdinDataWaitingMode.handleStdinDataWaitingMode
    case ModeType.Running:
      return HandleStdinDataRunningMode.handleStdinDataRunningMode
    case ModeType.FilterWaiting:
      return HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode
    case ModeType.FinishedRunning:
      return HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode
    case ModeType.Interrupted:
      return HandleStdinDataInterruptedMode.handleStdinDataInterruptedMode
    default:
      throw new Error(`unexpected stdin mode ${mode}`)
  }
}
