import * as AnsiKeys from '../AnsiKeys/AnsiKeys.js'
import * as InterruptedMessage from '../InterruptedMessage/InterruptedMessage.js'
import * as ModeType from '../ModeType/ModeType.js'
import * as Stdout from '../Stdout/Stdout.js'
import * as WatchUsage from '../WatchUsage/WatchUsage.js'

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
      Stdout.write(InterruptedMessage.print() + '\n' + WatchUsage.print())
      return {
        ...state,
        mode: ModeType.Interrupted,
      }
  }
}
