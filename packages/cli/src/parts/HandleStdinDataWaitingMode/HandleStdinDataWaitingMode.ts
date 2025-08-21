import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.ts'
import * as AnsiKeys from '../AnsiKeys/AnsiKeys.ts'
import * as Character from '../Character/Character.ts'
import * as CliKeys from '../CliKeys/CliKeys.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as PatternUsage from '../PatternUsage/PatternUsage.ts'

export const handleStdinDataWaitingMode = async (state, key) => {
  switch (key) {
    case AnsiKeys.ControlC:
    case AnsiKeys.ControlD:
      return {
        ...state,
        mode: ModeType.Exit,
      }
    case AnsiKeys.Enter: {
      const eraseLine = await AnsiEscapes.eraseEndLine()
      const cursorLeft = await AnsiEscapes.cursorLeft()
      return {
        ...state,
        mode: ModeType.Running,
        stdout: [...state.stdout, eraseLine + cursorLeft],
      }
    }
    case AnsiKeys.ArrowUp:
    case AnsiKeys.ArrowDown:
      return state
    case AnsiKeys.AltBackspace:
    case AnsiKeys.ControlBackspace: {
<<<<<<< HEAD
      const eraseLine = await AnsiEscapes.eraseEndLine()
=======
      const eraseLine = await AnsiEscapes.eraseLine()
>>>>>>> origin/main
      const cursorLeft = await AnsiEscapes.cursorLeft()
      return {
        ...state,
        value: Character.EmptyString,
        stdout: [...state.stdout, eraseLine + cursorLeft],
      }
    }
    case AnsiKeys.Backspace(state.isWindows):
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
      const clear = await AnsiEscapes.clear(state.isWindows)
      return {
        ...state,
        value: Character.EmptyString,
        mode: ModeType.FilterWaiting,
        stdout: [...state.stdout, clear + (await PatternUsage.print())],
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
