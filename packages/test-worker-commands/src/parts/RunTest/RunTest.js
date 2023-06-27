import * as CleanUpTestState from '../CleanUpTestState/CleanUpTestState.js'
import * as GetBinaryPath from '../GetBinaryPath/GetBinaryPath.js'
import * as ImportScript from '../ImportScript/ImportScript.js'
import * as JsonRpcEvent from '../JsonRpcEvent/JsonRpcEvent.js'
import * as LaunchElectron from '../LaunchElectron/LaunchElectron.js'
import * as LaunchElectronApp from '../LaunchElectronApp/LaunchElectronApp.js'
import * as PrettyError from '../PrettyError/PrettyError.js'
import * as TestWorkerEventType from '../TestWorkerEventType/TestWorkerEventType.js'
import * as GetVsCodeArgs from '../GetVsCodeArgs/GetVsCodeArgs.js'
import * as GetUserDataDir from '../GetUserDataDir/GetUserDataDir.js'

export const runTest = async (state, file, relativeDirName, relativeFilePath, fileName, root, headlessMode, color, callback) => {
  try {
    const start = performance.now()
    callback(JsonRpcEvent.create(TestWorkerEventType.TestRunning, [file, relativeDirName, fileName]))
    const binaryPath = await GetBinaryPath.getBinaryPath()
    const userDataDir = await GetUserDataDir.getUserDataDir()
    console.log({ userDataDir })
    const args = GetVsCodeArgs.getVscodeArgs({
      userDataDir,
      extraLaunchArgs: [],
    })
    const env = {
      ...process.env,
      XDG_CONFIG_HOME: userDataDir,
      XDG_CACHE_HOME: userDataDir,
    }
    const electronApp = await LaunchElectronApp.launch({
      cliPath: binaryPath,
      args,
      headlessMode: false,
      env,
    })

    const module = await ImportScript.importScript(file)
    const win = await electronApp.firstWindow()
    await new Promise((r) => {
      setTimeout(r, 100000)
    })

    console.log({ electronApp, binaryPath })
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
