import * as ImportTest from '../ImportTest/ImportTest.js'
import * as TestStage from '../TestStage/TestStage.js'

export const runTestWithCallback = async (pageObject, file) => {
  const module = await ImportTest.importTest(file)
  if (module.skip) {
    return true
  }
  await TestStage.run(module, pageObject)
}
