import * as AnsiKeys from '../AnsiKeys/AnsiKeys.js'
import * as ModeType from '../ModeType/ModeType.js'

export const handleStdinDataRunningMode = (state, key) => {
  switch (key) {
    case AnsiKeys.ControlC:
    case AnsiKeys.ControlD:
      return {
        ...state,
        mode: ModeType.Exit,
      }
    case AnsiKeys.ArrowUp:
    case AnsiKeys.ArrowDown:
    case AnsiKeys.AltBackspace:
    case AnsiKeys.ControlBackspace:
    case AnsiKeys.Backspace:
    case AnsiKeys.ArrowLeft:
    case AnsiKeys.ArrowRight:
      return state
    default:
      return state
  }
}
