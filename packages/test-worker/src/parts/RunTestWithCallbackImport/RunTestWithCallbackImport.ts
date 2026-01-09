import * as ImportTest from '../ImportTest/ImportTest.ts'
import * as TestStage from '../TestStage/TestStage.ts'

export const runTest = async ({
  absolutePath,
  forceRun,
  pageObject,
}: {
  absolutePath: string
  forceRun: boolean
  pageObject: any
}) => {
  const module = await ImportTest.importTest(absolutePath)
  const wasOriginallySkipped = module.skip
  if (module.skip && !forceRun) {
    return { skipped: true, wasOriginallySkipped }
  }
  await TestStage.run(module, pageObject)
  return { skipped: false, wasOriginallySkipped }
}
