import * as SpecialStdin from '../SpecialStdin/SpecialStdin.ts'
import * as StartRunning from '../StartRunning/StartRunning.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as WatchUsage from '../WatchUsage/WatchUsage.ts'

export const initialStart = async (options): Promise<void> => {
  if (options.watch) {
    await SpecialStdin.start()
  }
  if (options.watch && !options.filter) {
    await Stdout.write(await WatchUsage.print())
    return
  }
  await StartRunning.startRunning({
    filterValue: options.filter,
    headlessMode: options.headless,
    color: options.color,
    checkLeaks: options.checkLeaks,
    runSkippedTestsAnyway: options.runSkippedTestsAnyway,
    recordVideo: options.recordVideo,
    cwd: options.cwd,
    runs: options.runs,
    measure: options.measure,
    measureAfter: options.measureAfter,
    timeouts: options.timeouts,
    timeoutBetween: options.timeoutBetween,
    restartBetween: options.restartBetween,
    runMode: options.runMode,
    ide: options.ide,
    ideVersion: options.ideVersion,
    vscodePath: options.vscodePath,
    commit: options.commit,
    setupOnly: options.setupOnly,
    workers: options.workers,
    isWindows: options.isWindows,
  })
}
