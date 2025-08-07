import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.js'
import * as RunTest from '../RunTest/RunTest.js'
import * as Stdout from '../Stdout/Stdout.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

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
) => {
  await Stdout.write(AnsiEscapes.clear)
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
  )
}
