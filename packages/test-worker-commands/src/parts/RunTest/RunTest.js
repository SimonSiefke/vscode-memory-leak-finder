import * as CleanUpTestState from '../CleanUpTestState/CleanUpTestState.js'
import * as Expect from '../Expect/Expect.js'
import * as GetBinaryPath from '../GetBinaryPath/GetBinaryPath.js'
import * as ImportScript from '../ImportScript/ImportScript.js'
import * as JsonRpcEvent from '../JsonRpcEvent/JsonRpcEvent.js'
import * as LaunchElectron from '../LaunchElectron/LaunchElectron.js'
import * as LaunchElectronApp from '../LaunchElectronApp/LaunchElectronApp.js'
import * as PrettyError from '../PrettyError/PrettyError.js'
import * as TestWorkerEventType from '../TestWorkerEventType/TestWorkerEventType.js'

export const runTest = async (file, relativeDirName, relativeFilePath, fileName, root, headlessMode, color, callback) => {
  try {
    const start = performance.now()
    callback(JsonRpcEvent.create(TestWorkerEventType.TestRunning, [file, relativeDirName, fileName]))
    const module = await ImportScript.importScript(file)
    const binaryPath = await GetBinaryPath.getBinaryPath()
    const { electronApp } = await LaunchElectronApp.launch({
      cliPath: binaryPath,
      args: [],
      headlessMode: false,
    })
    // await module.test({ electronApp, expect });
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
