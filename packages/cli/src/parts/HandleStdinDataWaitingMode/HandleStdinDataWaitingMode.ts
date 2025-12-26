import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.ts'
import * as AnsiKeys from '../AnsiKeys/AnsiKeys.ts'
import * as Character from '../Character/Character.ts'
import * as CliKeys from '../CliKeys/CliKeys.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as PatternUsage from '../PatternUsage/PatternUsage.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'

<<<<<<< HEAD
export const handleStdinDataWaitingMode = async (state: StdinDataState.StdinDataState, key: string): Promise<StdinDataState.StdinDataState> => {
=======
export const handleStdinDataWaitingMode = async (
  state: StdinDataState.StdinDataState,
  key: string,
): Promise<StdinDataState.StdinDataState> => {
>>>>>>> origin/main
  switch (key) {
    case AnsiKeys.AltBackspace:
    case AnsiKeys.ControlBackspace: {
      const eraseLine = await AnsiEscapes.eraseLine()
      const cursorLeft = await AnsiEscapes.cursorLeft()
      return {
        ...state,
        stdout: [...state.stdout, eraseLine + cursorLeft],
        value: Character.EmptyString,
      }
    }
    case AnsiKeys.ArrowDown:
    case AnsiKeys.ArrowUp:
      return state
    case AnsiKeys.ArrowLeft:
    case AnsiKeys.ArrowRight:
      return state
    case AnsiKeys.Backspace(state.isWindows):
      return {
        ...state,
        value: state.value.slice(0, -1),
      }
    case AnsiKeys.ControlC:
    case AnsiKeys.ControlD:
      return {
        ...state,
        mode: ModeType.Exit,
      }
    case AnsiKeys.Enter: {
      const eraseLine = await AnsiEscapes.eraseLine()
      const cursorLeft = await AnsiEscapes.cursorLeft()
      return {
        ...state,
        mode: ModeType.Running,
        stdout: [...state.stdout, eraseLine + cursorLeft],
      }
    }
    case AnsiKeys.Escape:
      return state
    case CliKeys.All:
      return {
        ...state,
        mode: ModeType.Running,
        value: Character.EmptyString,
      }
    case CliKeys.FilterMode:
      const clear = await AnsiEscapes.clear(state.isWindows)
      return {
        ...state,
        mode: ModeType.FilterWaiting,
        stdout: [...state.stdout, clear + (await PatternUsage.print())],
        value: Character.EmptyString,
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
    default:
      return state
  }
}
