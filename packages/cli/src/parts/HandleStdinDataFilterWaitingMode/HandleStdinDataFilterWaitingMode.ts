import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.ts'
import * as AnsiKeys from '../AnsiKeys/AnsiKeys.ts'
import * as Character from '../Character/Character.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as WatchUsage from '../WatchUsage/WatchUsage.ts'
import * as PreviousFilters from '../PreviousFilters/PreviousFilters.ts'

export const handleStdinDataFilterWaitingMode = async (state, key) => {
  switch (key) {
    case AnsiKeys.ControlC:
    case AnsiKeys.ControlD:
      return {
        ...state,
        mode: ModeType.Exit,
      }
    case AnsiKeys.Enter:
      return {
        ...state,
        mode: ModeType.Running,
        stdout: [...state.stdout, AnsiEscapes.eraseLine + AnsiEscapes.cursorLeft],
        previousFilters: state.value ? [state.value, ...state.previousFilters] : state.previousFilters,
      }

    case AnsiKeys.AltBackspace:
    case AnsiKeys.ControlBackspace:
      if (!state.value) {
        return state
      }
      return {
        ...state,
        value: Character.EmptyString,
        stdout: [...state.stdout, AnsiEscapes.cursorBackward(state.value.length) + AnsiEscapes.eraseEndLine],
      }
    case AnsiKeys.Backspace(state.isWindows):
      if (state.value === Character.EmptyString) {
        return state
      }
      return {
        ...state,
        value: state.value.slice(0, -1),
        stdout: [...state.stdout, AnsiEscapes.backspace],
      }
    case AnsiKeys.ArrowLeft:
    case AnsiKeys.ArrowRight:
    case AnsiKeys.Home:
    case AnsiKeys.End:
      return state
    case AnsiKeys.Escape:
      return {
        ...state,
        mode: ModeType.Waiting,
        stdout: [...state.stdout, AnsiEscapes.clear(state.isWindows) + (await WatchUsage.print())],
      }
    case AnsiKeys.ArrowUp:
      const previousFilters = PreviousFilters.get()
      if (previousFilters.length === 0) {
        return state
      }
      const top = previousFilters[0]
      const prefix = state.value ? AnsiEscapes.cursorBackward(state.value.length) + AnsiEscapes.eraseEndLine : ''
      return {
        ...state,
        value: top,
        stdout: [...state.stdout, prefix + top],
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
