import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.ts'
import * as RunTest from '../RunTest/RunTest.ts'
import type { StartRunningOptions } from './StartRunningOptions.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export const startRunning = async (options: StartRunningOptions): Promise<void> => {
  const {
    filterValue,
    headlessMode,
    color,
    checkLeaks,
    recordVideo,
    cwd,
    runs,
    measure,
    measureAfter,
    timeouts,
    timeoutBetween,
    restartBetween,
    runMode,
    ide,
    ideVersion,
    vscodePath,
    commit,
    setupOnly,
    workers,
    isWindows,
  } = options
  const clear = await AnsiEscapes.clear(isWindows)
  await Stdout.write(clear)
  const rpc = await RunTest.prepare()
  await rpc.invoke(
    TestWorkerCommandType.RunTests,
    cwd,
    cwd,
    filterValue,
    headlessMode,
    color,
    checkLeaks,
    recordVideo,
    runs,
    measure,
    measureAfter,
    timeouts,
    timeoutBetween,
    restartBetween,
    runMode,
    ide,
    ideVersion,
    vscodePath,
    commit,
    setupOnly,
    workers,
  )
}
