import * as RunTest from '../RunTest/RunTest.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export const startRunning = async (
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
) => {
  const clear = await StdoutWorker.invoke('Stdout.getClear')
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
