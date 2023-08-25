import { copyFile, mkdir } from 'fs/promises'
import { dirname } from 'path'
import * as CreateTestWorkspace from '../CreateTestWorkspace/CreateTestWorkspace.js'
import * as DefaultVscodeSettingsPath from '../DefaultVscodeSettingsPath/DefaultVsCodeSettingsPath.js'
import * as GetBinaryPath from '../GetBinaryPath/GetBinaryPath.js'
import * as GetUserDataDir from '../GetUserDataDir/GetUserDataDir.js'
import * as GetVsCodeArgs from '../GetVsCodeArgs/GetVsCodeArgs.js'
import * as GetVsCodeEnv from '../GetVsCodeEnv/GetVsCodeEnv.js'
import * as LaunchElectron from '../LaunchElectron/LaunchElectron.js'
import { join } from '../Path/Path.js'
import * as Root from '../Root/Root.js'
import { VError } from '../VError/VError.js'

const getRuntimeDir = () => {
  const runtimeDir = join(Root.root, '.vscode-runtime-dir')
  // vscode doesn't allow a socket file that is longer than 107 characters
  // the socket file is ~30 characters longer than runtimeDir
  if (runtimeDir.length > 70) {
    return ''
  }
  return runtimeDir
}

export const launchVsCode = async ({ headlessMode, cwd }) => {
  try {
    const testWorkspacePath = join(Root.root, '.vscode-test-workspace')
    await CreateTestWorkspace.createTestWorkspace(testWorkspacePath)
    const testExtensionsPath = join(Root.root, '.vscode-extensions')
    const runtimeDir = getRuntimeDir()
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
    const env = GetVsCodeEnv.getVsCodeEnv({ extensionsFolder: testExtensionsPath, runtimeDir })
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
