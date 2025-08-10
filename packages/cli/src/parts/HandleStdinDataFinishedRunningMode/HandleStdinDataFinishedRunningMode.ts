import * as AnsiKeys from '../AnsiKeys/AnsiKeys.ts'
import * as CliKeys from '../CliKeys/CliKeys.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as PatternUsage from '../PatternUsage/PatternUsage.ts'
import * as WatchUsage from '../WatchUsage/WatchUsage.ts'
import * as Character from '../Character/Character.ts'

export interface FinishedRunningState {
  value: string
  mode: number
  stdout: string[]
  headless?: boolean
  // Allow additional properties carried through state
  [key: string]: any
}

export const handleStdinDataFinishedRunningMode = async (state: FinishedRunningState, key: string): Promise<FinishedRunningState> => {
  const currentStdout = state.stdout

  switch (key) {
    case AnsiKeys.ControlC:
    case AnsiKeys.ControlD:
      return {
        ...state,
        mode: ModeType.Exit,
      }
    case CliKeys.WatchMode: {
      const message = await WatchUsage.clearAndPrint()
      return {
        ...state,
        mode: ModeType.Waiting,
        stdout: [...currentStdout, message],
      }
    }
    case CliKeys.FilterMode: {
      const message = await PatternUsage.clearAndPrint()
      return {
        ...state,
        value: Character.EmptyString,
        mode: ModeType.FilterWaiting,
        stdout: [...currentStdout, message],
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
      return { ...state }
  }
}
