import * as Assert from '../Assert/Assert.ts'
import * as ImportTest from '../ImportTest/ImportTest.ts'
import * as TestStage from '../TestStage/TestStage.ts'

// @ts-ignore
export const setupTestWithCallback = async (pageObject, file, forceRun) => {
  Assert.object(pageObject)
  Assert.string(file)
  Assert.boolean(forceRun)
  const module = await ImportTest.importTest(file)
  const wasOriginallySkipped = Boolean(module.skip)
  if (module.skip && !forceRun) {
    return { skipped: true, wasOriginallySkipped, error: null }
  }
  try {
    await TestStage.beforeSetup(module, pageObject)
    await TestStage.setup(module, pageObject)
    return { skipped: false, wasOriginallySkipped, error: null }
  } catch (error) {
    // If setup fails, return the error information instead of throwing
    return { skipped: false, wasOriginallySkipped, error: error }
  }
}
