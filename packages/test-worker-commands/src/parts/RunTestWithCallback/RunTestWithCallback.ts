import * as RunTestWithCallbackImport from '../RunTestWithCallbackImport/RunTestWithCallbackImport.js'
import * as RunTestWithCallbackVm from '../RunTestWithCallbackVm/RunTestWithCallbackVm.js'
import * as TestRunMode from '../TestRunMode/TestRunMode.js'

const getModule = (runMode) => {
  switch (runMode) {
    case TestRunMode.Vm:
      return RunTestWithCallbackVm.runTest
    default:
      return RunTestWithCallbackImport.runTest
  }
}

export const runTestWithCallback = async (pageObject, file, forceRun, runMode) => {
  const fn = getModule(runMode)
  await fn(pageObject, file, forceRun)
}
