import * as ImportTest from '../ImportTest/ImportTest.ts'
import * as TestStage from '../TestStage/TestStage.ts'

export const runTest = async (pageObject: any, file: string, forceRun: boolean, inspectExtensions: boolean) => {
  const module = await ImportTest.importTest(file)
  const wasOriginallySkipped = module.skip
  if (inspectExtensions && Array.isArray(module.flags) && module.flags.includes('skipIfInspectExtensions')) {
    return { skipped: true, wasOriginallySkipped }
  }
  if (module.skip && !forceRun) {
    return { skipped: true, wasOriginallySkipped }
  }
  await TestStage.run(module, pageObject)
  return { skipped: false, wasOriginallySkipped }
}
