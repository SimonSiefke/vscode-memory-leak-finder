import * as SpecialStdin from '../SpecialStdin/SpecialStdin.ts'
import * as StartRunning from '../StartRunning/StartRunning.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const initialStart = async (options) => {
  if (options.watch) {
    await SpecialStdin.start()
  }
  if (options.watch && !options.filter) {
    const watchUsageMessage = await StdoutWorker.invoke('Stdout.getWatchUsageMessage')
    await Stdout.write(watchUsageMessage)
    return
  }
  await StartRunning.startRunning(
    options.filter,
    options.headless,
    options.color,
    options.checkLeaks,
    options.recordVideo,
    options.cwd,
    options.runs,
    options.measure,
    options.measureAfter,
    options.timeouts,
    options.timeoutBetween,
    options.restartBetween,
    options.runMode,
    options.ide,
    options.ideVersion,
    options.vscodePath,
    options.commit,
    options.setupOnly,
    options.workers,
    options.isWindows,
  )
}
