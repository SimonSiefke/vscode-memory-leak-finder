import type { StdinDataState } from '../StdinDataState/StdinDataState.ts'
import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.ts'
import * as AnsiKeys from '../AnsiKeys/AnsiKeys.ts'
import * as Character from '../Character/Character.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as PreviousFilters from '../PreviousFilters/PreviousFilters.ts'
import * as WatchUsage from '../WatchUsage/WatchUsage.ts'

export const handleStdinDataFilterWaitingMode = async (state: StdinDataState, key: string): Promise<StdinDataState> => {
  switch (key) {
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
        previousFilters: state.value ? [state.value, ...state.previousFilters] : state.previousFilters,
      }
    }

    case AnsiKeys.AltBackspace:
    case AnsiKeys.ControlBackspace: {
      if (!state.value) {
        return state
      }
      const cursorBackward: string = await AnsiEscapes.cursorBackward(state.value.length)
      const eraseEndLine: string = await AnsiEscapes.eraseEndLine()
      return {
        ...state,
        value: Character.EmptyString,
        stdout: [...state.stdout, cursorBackward + eraseEndLine],
      }
    }
    case AnsiKeys.Backspace(state.isWindows): {
      if (state.value === Character.EmptyString) {
        return state
      }
      const backspace: string = await AnsiEscapes.backspace()
      return {
        ...state,
        value: state.value.slice(0, -1),
        stdout: [...state.stdout, backspace],
      }
    }
    case AnsiKeys.ArrowLeft:
    case AnsiKeys.ArrowRight:
    case AnsiKeys.Home:
    case AnsiKeys.End:
      return state
    case AnsiKeys.Escape: {
      const clear = await AnsiEscapes.clear(state.isWindows)
      const watchUsage = await WatchUsage.print()
      return {
        ...state,
        mode: ModeType.Waiting,
        stdout: [...state.stdout, clear + watchUsage],
      }
    }
    case AnsiKeys.ArrowUp: {
      const previousFilters = PreviousFilters.get()
      if (previousFilters.length === 0) {
        return state
      }
      const top = previousFilters[0]
      const cursorBackward: string = await AnsiEscapes.cursorBackward(state.value.length)
      const eraseEndOfLine: string = await AnsiEscapes.eraseEndLine()
      const prefix = state.value ? cursorBackward + eraseEndOfLine : ''
      return {
        ...state,
        value: top,
        stdout: [...state.stdout, prefix + top],
      }
    }
    case AnsiKeys.ArrowUp:
    case AnsiKeys.ArrowDown:
      return state
    default:
      return {
        ...state,
        value: state.value + key,
        stdout: [...state.stdout, key],
      }
  }
}
