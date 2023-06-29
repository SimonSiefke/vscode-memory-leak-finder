import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.js'
import * as AnsiKeys from '../AnsiKeys/AnsiKeys.js'
import * as ModeType from '../ModeType/ModeType.js'
import * as Stdout from '../Stdout/Stdout.js'
import * as WatchUsage from '../WatchUsage/WatchUsage.js'
import * as Character from '../Character/Character.js'

export const handleStdinDataFilterWaitingMode = (state, key) => {
  switch (key) {
    case AnsiKeys.ControlC:
    case AnsiKeys.ControlD:
      return {
        ...state,
        mode: ModeType.Exit,
      }
    case AnsiKeys.Enter:
      Stdout.write(AnsiEscapes.eraseLine + AnsiEscapes.cursorLeft)
      return {
        ...state,
        mode: ModeType.Running,
      }
    case AnsiKeys.ArrowUp:
    case AnsiKeys.ArrowDown:
      return state
    case AnsiKeys.AltBackspace:
    case AnsiKeys.ControlBackspace:
      if (!state.value) {
        return state
      }
      Stdout.write(AnsiEscapes.cursorBackward(state.value.length) + AnsiEscapes.eraseEndLine)
      return {
        ...state,
        value: Character.EmptyString,
      }
    case AnsiKeys.Backspace:
      if (state.value === Character.EmptyString) {
        return state
      }
      Stdout.write(AnsiEscapes.backspace)
      return {
        ...state,
        value: state.value.slice(0, -1),
      }
    case AnsiKeys.ArrowLeft:
    case AnsiKeys.ArrowRight:
    case AnsiKeys.Home:
    case AnsiKeys.End:
      return state
    case AnsiKeys.Escape:
      Stdout.write(AnsiEscapes.clear + WatchUsage.print())
      return {
        ...state,
        mode: ModeType.Waiting,
      }
    default:
      Stdout.write(key)
      return {
        ...state,
        value: state.value + key,
      }
  }
}
