import * as Assert from '../Assert/Assert.ts'
import * as ImportTest from '../ImportTest/ImportTest.ts'
import * as TestStage from '../TestStage/TestStage.ts'

// @ts-ignore
export const setupTestWithCallback = async (pageObject, file, forceRun, isGithubActions) => {
  Assert.object(pageObject)
  Assert.string(file)
  Assert.boolean(forceRun)
  Assert.boolean(isGithubActions)
  const module = await ImportTest.importTest(file)
  const wasOriginallySkipped = Boolean(module.skip)
  const isCi = isGithubActions
  if (module.requiresNetwork && isCi) {
    return { error: null, skipped: true, wasOriginallySkipped }
  }
  if (module.skip && !forceRun) {
    return { error: null, skipped: true, wasOriginallySkipped }
  }
  try {
    await TestStage.beforeSetup(module, pageObject)
    await TestStage.setup(module, pageObject)
    return { error: null, skipped: false, wasOriginallySkipped }
  } catch (error) {
    // If setup fails, return the error information instead of throwing
    return { error: error, skipped: false, wasOriginallySkipped }
  }
}
