import * as ImportTest from '../ImportTest/ImportTest.ts'
import * as TestStage from '../TestStage/TestStage.ts'

export const runTest = async (pageObject, file, forceRun) => {
  const module = await ImportTest.importTest(file)
  const wasOriginallySkipped = module.skip
  if (module.skip && !forceRun) {
    return { skipped: true, wasOriginallySkipped }
  }
  await TestStage.run(module, pageObject)
  return { skipped: false, wasOriginallySkipped }
}
