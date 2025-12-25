import * as HandleStdinDataFilterWaitingMode from '../HandleStdinDataFilterWaitingMode/HandleStdinDataFilterWaitingMode.ts'
import * as HandleStdinDataFinishedRunningMode from '../HandleStdinDataFinishedRunningMode/HandleStdinDataFinishedRunningMode.ts'
import * as HandleStdinDataInterruptedMode from '../HandleStdinDataInterruptedMode/HandleStdinDataInterruptedMode.ts'
import * as HandleStdinDataRunningMode from '../HandleStdinDataRunningMode/HandleStdinDataRunningMode.ts'
import * as HandleStdinDataWaitingMode from '../HandleStdinDataWaitingMode/HandleStdinDataWaitingMode.ts'
import * as ModeType from '../ModeType/ModeType.ts'

export const getFn = (mode: number) => {
  switch (mode) {
    case ModeType.FilterWaiting:
      return HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode
    case ModeType.FinishedRunning:
      return HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode
    case ModeType.Interrupted:
      return HandleStdinDataInterruptedMode.handleStdinDataInterruptedMode
    case ModeType.Running:
      return HandleStdinDataRunningMode.handleStdinDataRunningMode
    case ModeType.Waiting:
      return HandleStdinDataWaitingMode.handleStdinDataWaitingMode
    default:
      throw new Error(`unexpected stdin mode ${mode}`)
  }
}
