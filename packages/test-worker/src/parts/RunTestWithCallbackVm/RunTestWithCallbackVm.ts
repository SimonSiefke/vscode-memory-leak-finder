import * as ImportUsingVm from '../ImportUsingVm/ImportUsingVm.ts'
import * as TestStage from '../TestStage/TestStage.ts'
import * as TestWorkerState from '../TestWorkerState/TestWorkerState.ts'

export const runTest = async (pageObject, file, forceRun) => {
  const module = await ImportUsingVm.importUsingVm(file)
  const wasOriginallySkipped = module.skip
  const inspectExtensions = TestWorkerState.getInspectExtensions()
  if (
    inspectExtensions &&
    Array.isArray(module.flags) &&
    module.flags.includes('skipIfInspectExtensions')
  ) {
    return { skipped: true, wasOriginallySkipped }
  }
  if (module.skip && !forceRun) {
    return { skipped: true, wasOriginallySkipped }
  }
  await TestStage.run(module, pageObject)
  return { skipped: false, wasOriginallySkipped }
}
