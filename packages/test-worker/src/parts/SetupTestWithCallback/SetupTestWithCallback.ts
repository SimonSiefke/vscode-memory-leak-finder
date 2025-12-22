import * as Assert from '../Assert/Assert.ts'
import * as ImportTest from '../ImportTest/ImportTest.ts'
import * as TestStage from '../TestStage/TestStage.ts'
import * as TestWorkerState from '../TestWorkerState/TestWorkerState.ts'

// @ts-ignore
export const setupTestWithCallback = async (pageObject: any, file: string, forceRun: boolean) => {
  Assert.object(pageObject)
  Assert.string(file)
  Assert.boolean(forceRun)
  const module = await ImportTest.importTest(file)
  const wasOriginallySkipped = Boolean(module.skip)
  const isCi = process.env.GITHUB_ACTIONS
  if (module.requiresNetwork && isCi) {
    return { error: null, skipped: true, wasOriginallySkipped }
  }
  const inspectExtensions = TestWorkerState.getInspectExtensions()
  if (inspectExtensions && Array.isArray(module.flags) && module.flags.includes('skipIfInspectExtensions')) {
    return { skipped: true, wasOriginallySkipped, error: null }
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
