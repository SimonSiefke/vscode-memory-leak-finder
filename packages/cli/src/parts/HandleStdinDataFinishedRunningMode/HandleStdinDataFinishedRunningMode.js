import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.js'
import * as AnsiKeys from '../AnsiKeys/AnsiKeys.js'
import * as CliKeys from '../CliKeys/CliKeys.js'
import * as ModeType from '../ModeType/ModeType.js'
import * as PatternUsage from '../PatternUsage/PatternUsage.js'
import * as Stdout from '../Stdout/Stdout.js'
import * as WatchUsage from '../WatchUsage/WatchUsage.js'
import * as Character from '../Character/Character.js'

export const handleStdinDataFinishedRunningMode = async (state, key) => {
  switch (key) {
    case AnsiKeys.ControlC:
    case AnsiKeys.ControlD:
      return {
        ...state,
        mode: ModeType.Exit,
      }
    case CliKeys.WatchMode:
      await Stdout.write(AnsiEscapes.cursorUp() + AnsiEscapes.eraseDown + WatchUsage.print())
      return {
        ...state,
        mode: ModeType.Waiting,
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
    case AnsiKeys.Enter:
      return {
        ...state,
        mode: ModeType.Running,
      }
    default:
      return state
  }
}
