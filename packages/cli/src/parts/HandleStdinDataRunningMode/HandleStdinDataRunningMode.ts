import * as AnsiKeys from '../AnsiKeys/AnsiKeys.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const handleStdinDataRunningMode = async (state, key) => {
  switch (key) {
    case AnsiKeys.ControlC:
    case AnsiKeys.ControlD:
      return {
        ...state,
        mode: ModeType.Exit,
      }
    case AnsiKeys.ArrowUp:
    case AnsiKeys.ArrowDown:
    case AnsiKeys.AltBackspace:
    case AnsiKeys.ControlBackspace:
    case AnsiKeys.Backspace:
    case AnsiKeys.ArrowLeft:
    case AnsiKeys.ArrowRight:
      return state
    default:
      const interruptedMessage = await StdoutWorker.invoke('Stdout.getInterruptedMessage')
      const watchUsageMessage = await StdoutWorker.invoke('Stdout.getWatchUsageMessage')
      await Stdout.write(interruptedMessage + '\n' + watchUsageMessage)
      return {
        ...state,
        mode: ModeType.Interrupted,
      }
  }
}
