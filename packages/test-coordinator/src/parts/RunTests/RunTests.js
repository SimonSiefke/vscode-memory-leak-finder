import * as RunTestsWithCallback from '../RunTestsWithCallback/RunTestsWithCallback.js'
import * as CliProcess from '../CliProcess/CliProcess.js'

const callback = (method, ...params) => {
  CliProcess.send(method, ...params)
}

export const runTests = (root, cwd, filterValue, headlessMode, color, checkLeaks, recordVideo, runs) => {
  return RunTestsWithCallback.runTests(root, cwd, filterValue, headlessMode, color, checkLeaks, recordVideo, runs, callback)
}
