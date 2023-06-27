import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.js'
import * as AnsiKeys from '../AnsiKeys/AnsiKeys.js'
import * as CliKeys from '../CliKeys/CliKeys.js'
import * as ModeType from '../ModeType/ModeType.js'
import * as PatternUsage from '../PatternUsage/PatternUsage.js'
import * as Stdout from '../Stdout/Stdout.js'

export const handleStdinDataWaitingMode = (state, key) => {
  switch (key) {
    case AnsiKeys.ControlC:
    case AnsiKeys.ControlD:
      return {
        ...state,
        mode: ModeType.Exit,
      }
    case AnsiKeys.Enter:
      Stdout.write(AnsiEscapes.eraseLine + AnsiEscapes.cursorLeft)
      return {
        ...state,
        mode: ModeType.Running,
      }
    case AnsiKeys.ArrowUp:
    case AnsiKeys.ArrowDown:
      return state
    case AnsiKeys.AltBackspace:
    case AnsiKeys.ControlBackspace:
      Stdout.write(AnsiEscapes.eraseLine + AnsiEscapes.cursorLeft)
      return {
        ...state,
        value: '',
      }
    case AnsiKeys.Backspace:
      return {
        ...state,
        value: state.value.slice(0, -1),
      }
    case AnsiKeys.ArrowLeft:
    case AnsiKeys.ArrowRight:
      return state
    case CliKeys.All:
      return {
        ...state,
        value: '',
        mode: ModeType.Running,
      }
    case CliKeys.FilterMode:
      Stdout.write(AnsiEscapes.clear + PatternUsage.print())
      return {
        ...state,
        value: '',
        mode: ModeType.FilterWaiting,
      }
    case CliKeys.Quit:
      return {
        ...state,
        mode: ModeType.Exit,
      }
    case AnsiKeys.Escape:
      return state
    default:
      return state
  }
}
