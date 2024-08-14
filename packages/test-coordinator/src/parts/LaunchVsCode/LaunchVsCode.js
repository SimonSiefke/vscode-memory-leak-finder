import { copyFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import * as CreateTestWorkspace from '../CreateTestWorkspace/CreateTestWorkspace.js'
import * as DefaultVscodeSettingsPath from '../DefaultVscodeSettingsPath/DefaultVsCodeSettingsPath.js'
import * as GetBinaryPath from '../GetBinaryPath/GetBinaryPath.js'
import * as GetUserDataDir from '../GetUserDataDir/GetUserDataDir.js'
import * as GetVsCodeArgs from '../GetVsCodeArgs/GetVsCodeArgs.js'
import * as GetVsCodeEnv from '../GetVsCodeEnv/GetVsCodeEnv.js'
import * as GetVscodeRuntimeDir from '../GetVscodeRuntimeDir/GetVscodeRuntimeDir.js'
import * as IsCi from '../IsCi/IsCi.js'
import * as LaunchElectron from '../LaunchElectron/LaunchElectron.js'
import { join } from '../Path/Path.js'
import * as RemoveVscodeBackups from '../RemoveVscodeBackups/RemoveVscodeBackups.js'
import * as RemoveVscodeGlobalStorage from '../RemoveVscodeGlobalStorage/RemoveVscodeGlobalStorage.js'
import * as RemoveVscodeWorkspaceStorage from '../RemoveVscodeWorkspaceStorage/RemoveVscodeWorkspaceStorage.js'
import * as Root from '../Root/Root.js'
import { VError } from '../VError/VError.js'

export const launchVsCode = async ({ headlessMode, cwd }) => {
  try {
    const testWorkspacePath = join(Root.root, '.vscode-test-workspace')
    await CreateTestWorkspace.createTestWorkspace(testWorkspacePath)
    await RemoveVscodeWorkspaceStorage.removeVsCodeWorkspaceStorage()
    if (IsCi.isCi) {
      await RemoveVscodeGlobalStorage.removeVsCodeGlobalStorage()
    }
    await RemoveVscodeBackups.removeVscodeBackups()
    const testExtensionsPath = join(Root.root, '.vscode-extensions')
    const runtimeDir = GetVscodeRuntimeDir.getVscodeRuntimeDir()
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
    const env = GetVsCodeEnv.getVsCodeEnv({ extensionsFolder: testExtensionsPath, runtimeDir, processEnv: process.env })
    console.log({ args })
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
