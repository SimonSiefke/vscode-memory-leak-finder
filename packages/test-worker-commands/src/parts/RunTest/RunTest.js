import * as CleanUpTestState from '../CleanUpTestState/CleanUpTestState.js'
import * as ImportScript from '../ImportScript/ImportScript.js'
import * as JsonRpcEvent from '../JsonRpcEvent/JsonRpcEvent.js'
import * as LaunchElectron from '../LaunchElectron/LaunchElectron.js'
import * as LaunchVsCode from '../LaunchVsCode/LaunchVsCode.js'
import * as PrettyError from '../PrettyError/PrettyError.js'
import * as TestStage from '../TestStage/TestStage.js'
import * as TestWorkerEventType from '../TestWorkerEventType/TestWorkerEventType.js'

export const runTest = async (state, file, relativeDirName, relativeFilePath, fileName, root, headlessMode, color, callback) => {
  try {
    const start = performance.now()
    callback(JsonRpcEvent.create(TestWorkerEventType.TestRunning, [file, relativeDirName, fileName]))
    const { pageObject } = await LaunchVsCode.launchVsCode({
      headlessMode,
    })
    const module = await ImportScript.importScript(file)
    await TestStage.beforeSetup(module, pageObject)
    await TestStage.setup(module, pageObject)
    await TestStage.run(module, pageObject)
    const end = performance.now()
    const duration = end - start
    callback(JsonRpcEvent.create(TestWorkerEventType.TestPassed, [file, relativeDirName, fileName, duration]))
    state.passed++
  } catch (error) {
    const prettyError = await PrettyError.prepare(error, { root, color })
    callback(JsonRpcEvent.create(TestWorkerEventType.TestFailed, [file, relativeDirName, relativeFilePath, fileName, prettyError]))
    state.failed++
  } finally {
    CleanUpTestState.cleanUpTestState()
    LaunchElectron.cleanup()
  }
}
