import * as RunTestWithCallbackImport from '../RunTestWithCallbackImport/RunTestWithCallbackImport.js'
import * as RunTestWithCallbackVm from '../RunTestWithCallbackVm/RunTestWithCallbackVm.js'
import * as TestRunMode from '../TestRunMode/TestRunMode.js'

const getModule = (runMode) => {
  switch (runMode) {
    case TestRunMode.Vm:
      return RunTestWithCallbackVm
    default:
      return RunTestWithCallbackImport
  }
}

export const runTestWithCallback = async (pageObject, file, forceRun, runMode) => {
  const module = getModule(runMode)
  const result = await module.runTest(pageObject, file, forceRun)
  return result
}
