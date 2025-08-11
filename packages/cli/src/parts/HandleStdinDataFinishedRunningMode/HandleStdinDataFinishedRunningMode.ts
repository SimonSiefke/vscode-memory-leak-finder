import * as AnsiKeys from '../AnsiKeys/AnsiKeys.ts'
import * as Character from '../Character/Character.ts'
import * as CliKeys from '../CliKeys/CliKeys.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as PatternUsage from '../PatternUsage/PatternUsage.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as WatchUsage from '../WatchUsage/WatchUsage.ts'

export const handleStdinDataFinishedRunningMode = async (
  state: StdinDataState.StdinDataState,
  key: string,
): Promise<StdinDataState.StdinDataState> => {
  const currentStdout = state.stdout

  switch (key) {
    case AnsiKeys.ControlC:
    case AnsiKeys.ControlD:
      return {
        ...state,
        mode: ModeType.Exit,
        stdout: currentStdout,
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
        stdout: currentStdout,
      }
    case CliKeys.ToggleHeadlessMode:
      return {
        ...state,
        headless: !state.headless,
        mode: ModeType.Running,
        stdout: currentStdout,
      }
    case AnsiKeys.Enter:
      return {
        ...state,
        mode: ModeType.Running,
        stdout: currentStdout,
      }
    default:
      return { ...state, stdout: currentStdout }
  }
}
