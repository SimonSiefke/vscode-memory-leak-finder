import * as RunTestsWithCallback from '../RunTestsWithCallback/RunTestsWithCallback.ts'
import * as CliProcess from '../CliProcess/CliProcess.ts'

const callback = (method, ...params) => {
  // TODO use invoke
  CliProcess.send(method, ...params)
}

export const runTests = (
  root,
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
) => {
  return RunTestsWithCallback.runTests(
    root,
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
    callback,
  )
}
