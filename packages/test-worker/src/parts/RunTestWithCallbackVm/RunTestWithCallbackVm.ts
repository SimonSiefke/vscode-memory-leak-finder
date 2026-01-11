import * as ImportUsingVm from '../ImportUsingVm/ImportUsingVm.ts'
import * as TestStage from '../TestStage/TestStage.ts'

export const runTest = async (pageObject: any, file: string, forceRun: boolean, platform: string) => {
  const module = await ImportUsingVm.importUsingVm(platform, file)
  const wasOriginallySkipped = module.skip
  if (module.skip && !forceRun) {
    return { skipped: true, wasOriginallySkipped }
  }
  await TestStage.run(module, pageObject)
  return { skipped: false, wasOriginallySkipped }
}
