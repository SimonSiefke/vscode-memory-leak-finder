import * as ImportTest from '../ImportTest/ImportTest.js'
import * as TestStage from '../TestStage/TestStage.js'

export const runTest = async (pageObject, file, forceRun) => {
  // TODO use vm
  console.log('use vm')
  const module = await ImportTest.importTest(file)
  if (module.skip && !forceRun) {
    return true
  }
  await TestStage.run(module, pageObject)
  return false
}
