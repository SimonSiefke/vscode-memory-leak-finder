import * as ImportUsingVm from '../ImportUsingVm/ImportUsingVm.ts'
import * as TestStage from '../TestStage/TestStage.ts'
import * as WrapTestStageError from '../WrapTestStageError/WrapTestStageError.ts'

export const runTest = async (pageObject: any, file: string, forceRun: boolean, platform: string) => {
  const module = await ImportUsingVm.importUsingVm(platform, file)
  const wasOriginallySkipped = module.skip
  if (module.skip && !forceRun) {
    return { skipped: true, wasOriginallySkipped }
  }
  try {
    await TestStage.run(module, pageObject)
  } catch (error) {
    throw WrapTestStageError.wrapTestStageError(error, 'run', file)
  }
  return { skipped: false, wasOriginallySkipped }
}
