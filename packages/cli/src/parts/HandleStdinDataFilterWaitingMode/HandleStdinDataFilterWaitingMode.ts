import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'
import * as AnsiKeys from '../AnsiKeys/AnsiKeys.ts'
import * as Character from '../Character/Character.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as PreviousFilters from '../PreviousFilters/PreviousFilters.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as WatchUsage from '../WatchUsage/WatchUsage.ts'

export const handleStdinDataFilterWaitingMode = async (state, key) => {
  switch (key) {
    case AnsiKeys.ControlC:
    case AnsiKeys.ControlD:
      return {
        ...state,
        mode: ModeType.Exit,
      }
    case AnsiKeys.Enter:
      if (state.value) {
        PreviousFilters.add(state.value)
      }
      const eraseLine = await StdoutWorker.invoke('Stdout.getEraseLine')
      const cursorLeft = await StdoutWorker.invoke('Stdout.getCursorLeft')
      await Stdout.write(eraseLine + cursorLeft)
      return {
        ...state,
        mode: ModeType.Running,
      }

    case AnsiKeys.AltBackspace:
    case AnsiKeys.ControlBackspace:
      if (!state.value) {
        return state
      }
      const cursorBackward = await StdoutWorker.invoke('Stdout.getCursorBackward')
      const eraseEndLine = await StdoutWorker.invoke('Stdout.getEraseEndLine')
      await Stdout.write(cursorBackward.repeat(state.value.length) + eraseEndLine)
      return {
        ...state,
        value: Character.EmptyString,
      }
    case AnsiKeys.Backspace:
      if (state.value === Character.EmptyString) {
        return state
      }
      const backspace = await StdoutWorker.invoke('Stdout.getBackspace')
      await Stdout.write(backspace)
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
      await Stdout.write(await WatchUsage.clearAndPrint())
      return {
        ...state,
        mode: ModeType.Waiting,
      }
    case AnsiKeys.ArrowUp:
      const previousFilters = PreviousFilters.get()
      if (previousFilters.length === 0) {
        return state
      }
      const top = previousFilters[0]
      const cb = await StdoutWorker.invoke('Stdout.getCursorBackward')
      const eel = await StdoutWorker.invoke('Stdout.getEraseEndLine')
      const prefix = state.value ? cb.repeat(state.value.length) + eel : ''
      await Stdout.write(prefix + top)
      return {
        ...state,
        value: top,
      }
    case AnsiKeys.ArrowUp:
    case AnsiKeys.ArrowDown:
      return state
    default:
      await Stdout.write(key)
      return {
        ...state,
        value: state.value + key,
      }
  }
}
