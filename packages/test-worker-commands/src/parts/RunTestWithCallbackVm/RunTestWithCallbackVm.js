import * as ImportUsingVm from '../ImportUsingVm/ImportUsingVm.js'
import * as TestStage from '../TestStage/TestStage.js'

export const runTest = async (pageObject, file, forceRun) => {
  const module = await ImportUsingVm.importUsingVm(file)
  if (module.skip) {
    return true
  }
  console.log(Object.prototype.abc)
  await TestStage.run(module, pageObject)
  return false
}
