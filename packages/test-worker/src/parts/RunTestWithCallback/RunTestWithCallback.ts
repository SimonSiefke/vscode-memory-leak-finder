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

export const runTestWithCallback = async ({
  absolutePath,
  forceRun,
  pageObject,
  platform,
  runMode,
}: {
  absolutePath: string
  forceRun: boolean
  pageObject: any
  platform: string
  runMode: any
}) => {
  const fn = getModule(runMode)
  if (runMode === TestRunMode.Vm) {
    await fn({ absolutePath, forceRun, pageObject, platform })
  } else {
    await fn({ absolutePath, forceRun, pageObject, platform })
  }
}
