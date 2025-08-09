import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.ts'
import * as AnsiKeys from '../AnsiKeys/AnsiKeys.ts'
import * as Character from '../Character/Character.ts'
import * as CliKeys from '../CliKeys/CliKeys.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as PatternUsage from '../PatternUsage/PatternUsage.ts'
import * as Stdout from '../Stdout/Stdout.ts'

export const handleStdinDataWaitingMode = async (state, key) => {
  switch (key) {
    case AnsiKeys.ControlC:
    case AnsiKeys.ControlD:
      return {
        ...state,
        mode: ModeType.Exit,
      }
    case AnsiKeys.Enter:
      await Stdout.write(AnsiEscapes.eraseLine + AnsiEscapes.cursorLeft)
      return {
        ...state,
        mode: ModeType.Running,
      }
    case AnsiKeys.ArrowUp:
    case AnsiKeys.ArrowDown:
      return state
    case AnsiKeys.AltBackspace:
    case AnsiKeys.ControlBackspace:
      await Stdout.write(AnsiEscapes.eraseLine + AnsiEscapes.cursorLeft)
      return {
        ...state,
        value: Character.EmptyString,
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
        value: Character.EmptyString,
        mode: ModeType.Running,
      }
    case CliKeys.FilterMode:
      await Stdout.write(AnsiEscapes.clear + PatternUsage.print())
      return {
        ...state,
        value: Character.EmptyString,
        mode: ModeType.FilterWaiting,
      }
    case CliKeys.Quit:
      return {
        ...state,
        mode: ModeType.Exit,
      }
    case CliKeys.ToggleHeadlessMode:
      return {
        ...state,
        headless: !state.headless,
        mode: ModeType.Running,
      }
    case AnsiKeys.Escape:
      return state
    default:
      return state
  }
}
