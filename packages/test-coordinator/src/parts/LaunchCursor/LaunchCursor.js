import { copyFile, mkdir, rm } from 'node:fs/promises'
import { dirname } from 'node:path'
import * as CreateTestWorkspace from '../CreateTestWorkspace/CreateTestWorkspace.js'
import * as DefaultVscodeSettingsPath from '../DefaultVscodeSettingsPath/DefaultVsCodeSettingsPath.js'
import * as DownloadAndUnzipCursor from '../DownloadAndUnzipCursor/DownloadAndUnzipCursor.js'
import * as GetExtensionsDir from '../GetExtensionsDir/GetExtensionsDir.js'
import * as GetUserDataDir from '../GetUserDataDir/GetUserDataDir.js'
import * as GetVsCodeArgs from '../GetVsCodeArgs/GetVsCodeArgs.js'
import * as GetVsCodeEnv from '../GetVsCodeEnv/GetVsCodeEnv.js'
import * as GetVscodeRuntimeDir from '../GetVscodeRuntimeDir/GetVscodeRuntimeDir.js'
import * as LaunchElectron from '../LaunchElectron/LaunchElectron.js'
import { join } from '../Path/Path.js'
import * as Root from '../Root/Root.js'
import { VError } from '../VError/VError.js'

export const launchCursor = async ({ headlessMode, cwd }) => {
  try {
    const testWorkspacePath = join(Root.root, '.cursor-test-workspace')
    await CreateTestWorkspace.createTestWorkspace(testWorkspacePath)
    // TODO
    // await RemoveVscodeWorkspaceStorage.removeVsCodeWorkspaceStorage()
    // if (IsCi.isCi) {
    //   await RemoveVscodeGlobalStorage.removeVsCodeGlobalStorage()
    // }
    // await RemoveVscodeBackups.removeVscodeBackups()
    const runtimeDir = GetVscodeRuntimeDir.getVscodeRuntimeDir()
    const binaryPath = await DownloadAndUnzipCursor.downloadAndUnzipCursor()
    const userDataDir = GetUserDataDir.getUserDataDir()
    const extensionsDir = GetExtensionsDir.getExtensionsDir()
    await rm(extensionsDir, { recursive: true, force: true })
    await mkdir(extensionsDir)
    const defaultSettingsSourcePath = DefaultVscodeSettingsPath.defaultVsCodeSettingsPath
    const settingsPath = join(userDataDir, 'User', 'settings.json')
    await mkdir(dirname(settingsPath), { recursive: true })
    await copyFile(defaultSettingsSourcePath, settingsPath)
    const args = GetVsCodeArgs.getVscodeArgs({
      userDataDir,
      extensionsDir,
      extraLaunchArgs: [testWorkspacePath],
    })
    const env = GetVsCodeEnv.getVsCodeEnv({ runtimeDir, processEnv: process.env })
    const { child, webSocketUrl } = await LaunchElectron.launchElectron({
      cliPath: binaryPath,
      args,
      headlessMode,
      cwd,
      env,
    })
    return {
      child,
      webSocketUrl,
    }
  } catch (error) {
    throw new VError(error, `Failed to launch VSCode`)
  }
}
