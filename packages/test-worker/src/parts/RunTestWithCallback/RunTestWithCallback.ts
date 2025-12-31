import * as PlatformState from '../PlatformState/PlatformState.ts'
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

export const runTestWithCallback = async (pageObject, file, forceRun, runMode) => {
  const fn = getModule(runMode)
  if (runMode === TestRunMode.Vm) {
    const platform = PlatformState.getPlatform()
    await fn(pageObject, file, forceRun, platform)
  } else {
    await fn(pageObject, file, forceRun)
  }
}
