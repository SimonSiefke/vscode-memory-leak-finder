import * as ImportTest from '../ImportTest/ImportTest.js'
import * as TestStage from '../TestStage/TestStage.js'

export const setupTestWithCallback = async (pageObject, file, forceRun) => {
  const module = await ImportTest.importTest(file)
  if (module.skip && !forceRun) {
    return true
  }
  await TestStage.beforeSetup(module, pageObject)
  await TestStage.setup(module, pageObject)
}
