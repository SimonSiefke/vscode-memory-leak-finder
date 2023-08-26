import * as ImportTest from '../ImportTest/ImportTest.js'
import * as TestStage from '../TestStage/TestStage.js'

export const setupTestWithCallback = async (pageObject, file) => {
  const module = await ImportTest.importTest(file)
  if (module.skip) {
    return true
  }
  await TestStage.beforeSetup(module, pageObject)
  await TestStage.setup(module, pageObject)
}
