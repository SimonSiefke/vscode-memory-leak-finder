import * as ImportUsingVm from '../ImportUsingVm/ImportUsingVm.ts'
import * as TestStage from '../TestStage/TestStage.ts'

export const runTest = async ({
  absolutePath,
  forceRun,
  pageObject,
  platform,
}: {
  absolutePath: string
  forceRun: boolean
  pageObject: any
  platform: string
}) => {
  const module = await ImportUsingVm.importUsingVm(platform, absolutePath)
  const wasOriginallySkipped = module.skip
  if (module.skip && !forceRun) {
    return { skipped: true, wasOriginallySkipped }
  }
  await TestStage.run(module, pageObject)
  return { skipped: false, wasOriginallySkipped }
}
