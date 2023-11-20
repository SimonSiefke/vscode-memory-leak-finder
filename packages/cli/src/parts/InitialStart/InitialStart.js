import * as SpecialStdin from '../SpecialStdin/SpecialStdin.js'
import * as StartRunning from '../StartRunning/StartRunning.js'
import * as Stdout from '../Stdout/Stdout.js'
import * as WatchUsage from '../WatchUsage/WatchUsage.js'

export const initialStart = async (options) => {
  if (options.watch) {
    SpecialStdin.start()
  }
  if (options.watch && !options.filter) {
    Stdout.write(WatchUsage.print())
    return
  }
  await StartRunning.startRunning(
    options.filter,
    options.headless,
    options.color,
    options.checkLeaks,
    options.measureAfter,
    options.recordVideo,
    options.cwd,
    options.runs,
    options.measure,
  )
}
