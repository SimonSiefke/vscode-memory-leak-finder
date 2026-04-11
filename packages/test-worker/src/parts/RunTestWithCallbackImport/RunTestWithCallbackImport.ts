import * as ImportTest from '../ImportTest/ImportTest.ts'
import * as TestStage from '../TestStage/TestStage.ts'
import * as WrapTestStageError from '../WrapTestStageError/WrapTestStageError.ts'

export const runTest = async (pageObject, file, forceRun) => {
  const module = await ImportTest.importTest(file)
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
