import { copyFile, mkdir } from 'fs/promises'
import { dirname } from 'path'
import * as DefaultVscodeSettingsPath from '../DefaultVscodeSettingsPath/DefaultVsCodeSettingsPath.js'
import * as Expect from '../Expect/Expect.js'
import * as GetBinaryPath from '../GetBinaryPath/GetBinaryPath.js'
import * as GetUserDataDir from '../GetUserDataDir/GetUserDataDir.js'
import * as GetVsCodeArgs from '../GetVsCodeArgs/GetVsCodeArgs.js'
import * as GetVsCodeEnv from '../GetVsCodeEnv/GetVsCodeEnv.js'
import * as LaunchElectronApp from '../LaunchElectronApp/LaunchElectronApp.js'
import * as PageObject from '../PageObject/PageObject.js'
import { join } from '../Path/Path.js'
import * as Root from '../Root/Root.js'
import { VError } from '../VError/VError.js'
import * as WaitForVsCodeToBeReady from '../WaitForVsCodeToBeReady/WaitForVsCodeToBeReady.js'

const getCwd = () => {
  if (process.env.VSCODE_CWD) {
    return process.env.VSCODE_CWD
  }
  return process.cwd()
}

export const launchVsCode = async ({ headlessMode }) => {
  const testWorkspacePath = join(Root.root, '.vscode-test-workspace')
  const testExtensionsPath = join(Root.root, '.vscode-extensions')
  await mkdir(testWorkspacePath, { recursive: true })
  const binaryPath = await GetBinaryPath.getBinaryPath()
  const userDataDir = GetUserDataDir.getUserDataDir()
  const defaultSettingsSourcePath = DefaultVscodeSettingsPath.defaultVsCodeSettingsPath
  const settingsPath = join(userDataDir, 'User', 'settings.json')
  await mkdir(dirname(settingsPath), { recursive: true })
  await copyFile(defaultSettingsSourcePath, settingsPath)
  const args = GetVsCodeArgs.getVscodeArgs({
    userDataDir,
    extraLaunchArgs: [testWorkspacePath],
  })
  const cwd = getCwd()
  const env = GetVsCodeEnv.getVsCodeEnv({ extensionsFolder: testExtensionsPath })
  const electronApp = await LaunchElectronApp.launch({
    cliPath: binaryPath,
    args,
    headlessMode,
    cwd,
    env,
  })
  const firstWindow = await electronApp.firstWindow()
  await WaitForVsCodeToBeReady.waitForVsCodeToBeReady({
    page: firstWindow,
    expect: Expect.expect,
  })
  const pageObjectContext = {
    page: firstWindow,
    expect: Expect.expect,
    VError,
    electronApp,
  }
  const pageObject = await PageObject.create(pageObjectContext)
  return {
    pageObject,
    firstWindow,
  }
}
