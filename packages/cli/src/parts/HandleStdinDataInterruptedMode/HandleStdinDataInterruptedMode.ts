import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.ts'
import * as AnsiKeys from '../AnsiKeys/AnsiKeys.ts'
import * as Character from '../Character/Character.ts'
import * as CliKeys from '../CliKeys/CliKeys.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as PatternUsage from '../PatternUsage/PatternUsage.ts'
import type { StdinDataState } from '../StdinDataState/StdinDataState.ts'

export const handleStdinDataInterruptedMode = async (state: StdinDataState, key: string): Promise<StdinDataState> => {
  switch (key) {
    case AnsiKeys.ControlC:
    case AnsiKeys.ControlD:
      return {
        ...state,
        mode: ModeType.Exit,
      }
    case CliKeys.FilterMode: {
      const clear = await AnsiEscapes.clear(state.isWindows)
      const patternUsage = await PatternUsage.print()
      return {
        ...state,
        value: Character.EmptyString,
        mode: ModeType.FilterWaiting,
        stdout: [...state.stdout, clear + patternUsage],
      }
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
