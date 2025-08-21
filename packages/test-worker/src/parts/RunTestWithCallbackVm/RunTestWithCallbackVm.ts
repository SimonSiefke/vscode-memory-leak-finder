import * as ImportUsingVm from '../ImportUsingVm/ImportUsingVm.ts'
import * as TestStage from '../TestStage/TestStage.ts'

export const runTest = async (pageObject, file, forceRun) => {
  const module = await ImportUsingVm.importUsingVm(file)
  if (module.skip) {
    return true
  }
  await TestStage.run(module, pageObject)
  return false
}
