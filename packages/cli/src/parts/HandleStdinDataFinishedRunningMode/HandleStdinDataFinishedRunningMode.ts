import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.ts'
import * as AnsiKeys from '../AnsiKeys/AnsiKeys.ts'
import * as CliKeys from '../CliKeys/CliKeys.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as PatternUsage from '../PatternUsage/PatternUsage.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as WatchUsage from '../WatchUsage/WatchUsage.ts'
import * as Character from '../Character/Character.ts'

export const handleStdinDataFinishedRunningMode = async (state, key) => {
  switch (key) {
    case AnsiKeys.ControlC:
    case AnsiKeys.ControlD:
      return {
        ...state,
        mode: ModeType.Exit,
      }
    case CliKeys.WatchMode:
      return {
        ...state,
        mode: ModeType.Waiting,
        stdout: [...state.stdout, AnsiEscapes.cursorUp() + AnsiEscapes.eraseDown + (await WatchUsage.print())],
      }
    case CliKeys.FilterMode:
      return {
        ...state,
        value: Character.EmptyString,
        mode: ModeType.FilterWaiting,
        stdout: [...state.stdout, AnsiEscapes.clear + PatternUsage.print()],
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
    case AnsiKeys.Enter:
      return {
        ...state,
        mode: ModeType.Running,
      }
    default:
      return state
  }
}
