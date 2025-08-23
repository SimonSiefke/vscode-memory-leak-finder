import * as CliProcess from '../CliProcess/CliProcess.ts'
import * as RunTestsWithCallback from '../RunTestsWithCallback/RunTestsWithCallback.ts'

const callback = async (method, ...params) => {
  await CliProcess.invoke(method, ...params)
}

export const runTests = (
  root,
  cwd,
  filterValue,
  headlessMode,
  color,
  checkLeaks,
  runSkippedTestsAnyway,
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
) => {
  return RunTestsWithCallback.runTests(
    root,
    cwd,
    filterValue,
    headlessMode,
    color,
    checkLeaks,
    runSkippedTestsAnyway,
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
    callback,
  )
}
