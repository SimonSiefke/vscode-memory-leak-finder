import * as AnsiKeys from '../AnsiKeys/AnsiKeys.ts'
import * as InterruptedMessage from '../InterruptedMessage/InterruptedMessage.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as WatchUsage from '../WatchUsage/WatchUsage.ts'

export const handleStdinDataRunningMode = async (state, key) => {
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
      return {
        ...state,
        mode: ModeType.Interrupted,
        stdout: [...state.stdout, (await InterruptedMessage.print()) + '\n' + (await WatchUsage.print())],
      }
  }
}
