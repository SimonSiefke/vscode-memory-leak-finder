import * as RunTestWithCallbackImport from '../RunTestWithCallbackImport/RunTestWithCallbackImport.ts'
import * as RunTestWithCallbackVm from '../RunTestWithCallbackVm/RunTestWithCallbackVm.ts'
import * as TestRunMode from '../TestRunMode/TestRunMode.ts'

const getModule = (runMode: number) => {
  switch (runMode) {
    case TestRunMode.Vm:
      return RunTestWithCallbackVm.runTest
    default:
      return RunTestWithCallbackImport.runTest
  }
}

export const runTestWithCallback = async (
  pageObject: any,
  file: string,
  forceRun: boolean,
  runMode: number,
  inspectExtensions: boolean,
) => {
  const fn = getModule(runMode)
  await fn(pageObject, file, forceRun, inspectExtensions)
}
