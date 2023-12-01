import * as ImportTest from '../ImportTest/ImportTest.js'
import * as TestStage from '../TestStage/TestStage.js'

export const runTestWithCallback = async (pageObject, file, forceRun) => {
  const module = await ImportTest.importTest(file)
  if (module.skip && !forceRun) {
    return true
  }
  await TestStage.run(module, pageObject)
}
