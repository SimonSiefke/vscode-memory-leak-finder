import * as ImportTest from '../ImportTest/ImportTest.js'
import * as TestStage from '../TestStage/TestStage.js'

export const runTestWithCallback = async (pageObject, file, root, color, callback) => {
  const module = await ImportTest.importTest(file)
  if (module.skip) {
    return
  }
  await TestStage.beforeSetup(module, pageObject)
  await TestStage.setup(module, pageObject)
  await TestStage.run(module, pageObject)
}
