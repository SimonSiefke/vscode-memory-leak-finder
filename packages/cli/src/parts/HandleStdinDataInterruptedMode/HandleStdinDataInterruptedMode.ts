import * as AnsiKeys from '../AnsiKeys/AnsiKeys.ts'
import * as Character from '../Character/Character.ts'
import * as CliKeys from '../CliKeys/CliKeys.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const handleStdinDataInterruptedMode = async (state, key) => {
  switch (key) {
    case AnsiKeys.ControlC:
    case AnsiKeys.ControlD:
      return {
        ...state,
        mode: ModeType.Exit,
      }
    case CliKeys.FilterMode:
      const clear = await StdoutWorker.invoke('Stdout.getClear')
      const patternUsage = await StdoutWorker.invoke('Stdout.getPatternUsageMessage')
      return {
        ...state,
        value: Character.EmptyString,
        mode: ModeType.FilterWaiting,
        stdout: [...state.stdout, clear + patternUsage],
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
