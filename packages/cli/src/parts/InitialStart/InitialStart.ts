import * as SpecialStdin from '../SpecialStdin/SpecialStdin.ts'
import * as StartRunning from '../StartRunning/StartRunning.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as WatchUsage from '../WatchUsage/WatchUsage.ts'

export const initialStart = async (options) => {
  if (options.watch) {
    await SpecialStdin.start()
  }
  if (options.watch && !options.filter) {
    await Stdout.write(WatchUsage.print())
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
  )
}
