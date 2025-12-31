import * as RunTestWithCallbackImport from '../RunTestWithCallbackImport/RunTestWithCallbackImport.ts'
import * as RunTestWithCallbackVm from '../RunTestWithCallbackVm/RunTestWithCallbackVm.ts'
import * as TestRunMode from '../TestRunMode/TestRunMode.ts'

const getModule = (runMode) => {
  switch (runMode) {
    case TestRunMode.Vm:
      return RunTestWithCallbackVm.runTest
    default:
      return RunTestWithCallbackImport.runTest
  }
}

export const runTestWithCallback = async (pageObject: any, file: string, forceRun: boolean, runMode: any, platform: string) => {
  const fn = getModule(runMode)
  if (runMode === TestRunMode.Vm) {
    await fn(pageObject, file, forceRun, platform)
  } else {
    await fn(pageObject, file, forceRun, platform)
  }
}
