import * as ImportScript from '../ImportScript/ImportScript.js'
import * as JsonRpcEvent from '../JsonRpcEvent/JsonRpcEvent.js'
import * as PrettyError from '../PrettyError/PrettyError.js'
import * as TestStage from '../TestStage/TestStage.js'
import * as TestWorkerEventType from '../TestWorkerEventType/TestWorkerEventType.js'
import * as Time from '../Time/Time.js'

export const runTest = async (
  state,
  file,
  relativeDirName,
  relativeFilePath,
  fileName,
  root,
  headlessMode,
  color,
  pageObject,
  start,
  callback
) => {
  try {
    const module = await ImportScript.importScript(file)
    if (module.skip) {
      const end = Time.now()
      const duration = end - start
      callback(JsonRpcEvent.create(TestWorkerEventType.TestSkipped, [file, relativeDirName, fileName, duration]))
      state.skipped++
      return
    }
    await TestStage.beforeSetup(module, pageObject)
    await TestStage.setup(module, pageObject)
    await TestStage.run(module, pageObject)
    const end = Time.now()
    const duration = end - start
    callback(JsonRpcEvent.create(TestWorkerEventType.TestPassed, [file, relativeDirName, fileName, duration]))
    state.passed++
  } catch (error) {
    const prettyError = await PrettyError.prepare(error, { root, color })
    callback(JsonRpcEvent.create(TestWorkerEventType.TestFailed, [file, relativeDirName, relativeFilePath, fileName, prettyError]))
    state.failed++
  } finally {
    // CleanUpTestState.cleanUpTestState()
    // LaunchElectron.cleanup()
  }
}
