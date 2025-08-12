import * as ImportTest from '../ImportTest/ImportTest.ts'
import * as TestStage from '../TestStage/TestStage.ts'
import * as Assert from '../Assert/Assert.ts'

// @ts-ignore
export const setupTestWithCallback = async (pageObject, file, forceRun) => {
  Assert.object(pageObject)
  Assert.string(file)
  Assert.boolean(forceRun)
  const module = await ImportTest.importTest(file)
  if (module.skip && !forceRun) {
    return true
  }
  await TestStage.beforeSetup(module, pageObject)
  await TestStage.setup(module, pageObject)
}
