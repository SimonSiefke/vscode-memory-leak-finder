import { mkdir, writeFile } from 'fs/promises'
import * as CleanUpTestState from '../CleanUpTestState/CleanUpTestState.js'
import * as Expect from '../Expect/Expect.js'
import * as GetBinaryPath from '../GetBinaryPath/GetBinaryPath.js'
import * as GetDefaultVsCodeSettings from '../GetDefaultVscodeSettings/GetDefaultVsCodeSettings.js'
import * as GetUserDataDir from '../GetUserDataDir/GetUserDataDir.js'
import * as GetVsCodeArgs from '../GetVsCodeArgs/GetVsCodeArgs.js'
import * as ImportScript from '../ImportScript/ImportScript.js'
import * as JsonRpcEvent from '../JsonRpcEvent/JsonRpcEvent.js'
import * as LaunchElectron from '../LaunchElectron/LaunchElectron.js'
import * as LaunchElectronApp from '../LaunchElectronApp/LaunchElectronApp.js'
import { join } from '../Path/Path.js'
import * as PrettyError from '../PrettyError/PrettyError.js'
import * as Root from '../Root/Root.js'
import * as TestWorkerEventType from '../TestWorkerEventType/TestWorkerEventType.js'
import * as WaitForVsCodeToBeReady from '../WaitForVsCodeToBeReady/WaitForVsCodeToBeReady.js'
import * as PageObject from '../PageObject/PageObject.js'
import * as TestStage from '../TestStage/TestStage.js'
import { VError } from '../VError/VError.js'

export const runTest = async (state, file, relativeDirName, relativeFilePath, fileName, root, headlessMode, color, callback) => {
  try {
    const start = performance.now()
    callback(JsonRpcEvent.create(TestWorkerEventType.TestRunning, [file, relativeDirName, fileName]))
    const testWorkspacePath = join(Root.root, '.vscode-test-workspace')
    await mkdir(testWorkspacePath, { recursive: true })
    const binaryPath = await GetBinaryPath.getBinaryPath()
    const userDataDir = GetUserDataDir.getUserDataDir()
    const settings = GetDefaultVsCodeSettings.getDefaultVsCodeSettings()
    const settingsString = JSON.stringify(settings, null, 2) + '\n'
    const settingsPath = join(userDataDir, 'User', 'settings.json')
    await writeFile(settingsPath, settingsString)
    const args = GetVsCodeArgs.getVscodeArgs({
      userDataDir,
      extraLaunchArgs: [],
    })
    const electronApp = await LaunchElectronApp.launch({
      cliPath: binaryPath,
      args,
      headlessMode: false,
      cwd: testWorkspacePath,
    })
    const firstWindow = await electronApp.firstWindow()
    await WaitForVsCodeToBeReady.waitForVsCodeToBeReady({
      page: firstWindow,
      expect: Expect.expect,
    })
    console.log('vscode is ready now')
    const module = await ImportScript.importScript(file)
    const pageObjectContext = {
      page: firstWindow,
      expect: Expect.expect,
      VError,
      electronApp,
    }
    const pageObject = await PageObject.create(pageObjectContext)
    await TestStage.beforeSetup(module, pageObject)
    await TestStage.setup(module, pageObject)
    await TestStage.run(module, pageObject)
    // console.log({ pageObject })
    // await new Promise((r) => {
    // setTimeout(r, 100000)
    // })

    // console.log({ electronApp, binaryPath })
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
