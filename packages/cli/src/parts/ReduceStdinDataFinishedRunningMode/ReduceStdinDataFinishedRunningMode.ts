import * as AnsiKeys from '../AnsiKeys/AnsiKeys.ts'
import * as CliKeys from '../CliKeys/CliKeys.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as PatternUsage from '../PatternUsage/PatternUsage.ts'
import * as WatchUsage from '../WatchUsage/WatchUsage.ts'
import * as Character from '../Character/Character.ts'

export type FinishedRunningState = any

export interface ReduceResult {
  state: FinishedRunningState
  stdout: string[]
}

export const reduce = async (state: FinishedRunningState, key: string): Promise<ReduceResult> => {
  switch (key) {
    case AnsiKeys.ControlC:
    case AnsiKeys.ControlD:
      return {
        state: {
          ...state,
          mode: ModeType.Exit,
        },
        stdout: [],
      }
    case CliKeys.WatchMode: {
      const message = await WatchUsage.clearAndPrint()
      return {
        state: {
          ...state,
          mode: ModeType.Waiting,
        },
        stdout: [message],
      }
    }
    case CliKeys.FilterMode: {
      const message = await PatternUsage.clearAndPrint()
      return {
        state: {
          ...state,
          value: Character.EmptyString,
          mode: ModeType.FilterWaiting,
        },
        stdout: [message],
      }
    }
    case CliKeys.Quit:
      return {
        state: {
          ...state,
          mode: ModeType.Exit,
        },
        stdout: [],
      }
    case CliKeys.ToggleHeadlessMode:
      return {
        state: {
          ...state,
          headless: !state.headless,
          mode: ModeType.Running,
        },
        stdout: [],
      }
    case AnsiKeys.Enter:
      return {
        state: {
          ...state,
          mode: ModeType.Running,
        },
        stdout: [],
      }
    default:
      return {
        state,
        stdout: [],
      }
  }
}
