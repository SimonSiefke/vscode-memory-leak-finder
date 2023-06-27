import * as HandleStdinDataFilterWaitingMode from '../HandleStdinDataFilterWaitingMode/HandleStdinDataFilterWaitingMode.js'
import * as HandleStdinDataFinishedRunningMode from '../HandleStdinDataFinishedRunningMode/HandleStdinDataFinishedRunningMode.js'
import * as HandleStdinDataRunningMode from '../HandleStdinDataRunningMode/HandleStdinDataRunningMode.js'
import * as HandleStdinDataWaitingMode from '../HandleStdinDataWaitingMode/HandleStdinDataWaitingMode.js'
import * as ModeType from '../ModeType/ModeType.js'

const getFn = (mode) => {
  switch (mode) {
    case ModeType.Waiting:
      return HandleStdinDataWaitingMode.handleStdinDataWaitingMode
    case ModeType.Running:
      return HandleStdinDataRunningMode.handleStdinDataRunningMode
    case ModeType.FilterWaiting:
      return HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode
    case ModeType.FinishedRunning:
      return HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode
    default:
      throw new Error(`unexpected stdin mode ${mode}`)
  }
}

export const getNewStdinState = (state, key) => {
  const fn = getFn(state.mode)
  return fn(state, key)
}
