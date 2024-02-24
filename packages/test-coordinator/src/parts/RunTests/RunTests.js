import * as RunTestsWithCallback from '../RunTestsWithCallback/RunTestsWithCallback.js'
import * as CliProcess from '../CliProcess/CliProcess.js'

const callback = (method, ...params) => {
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
    callback,
  )
}
