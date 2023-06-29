import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.js'
import * as AnsiKeys from '../AnsiKeys/AnsiKeys.js'
import * as CliKeys from '../CliKeys/CliKeys.js'
import * as ModeType from '../ModeType/ModeType.js'
import * as PatternUsage from '../PatternUsage/PatternUsage.js'
import * as Stdout from '../Stdout/Stdout.js'

export const handleStdinDataInterruptedMode = (state, key) => {
  switch (key) {
    case AnsiKeys.ControlC:
    case AnsiKeys.ControlD:
      return {
        ...state,
        mode: ModeType.Exit,
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
