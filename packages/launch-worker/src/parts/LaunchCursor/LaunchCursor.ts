import { copyFile, mkdir, rm } from 'node:fs/promises'
import { dirname } from 'node:path'
import * as CreateTestWorkspace from '../CreateTestWorkspace/CreateTestWorkspace.ts'
import * as DefaultVscodeSettingsPath from '../DefaultVscodeSettingsPath/DefaultVsCodeSettingsPath.ts'
import * as DownloadAndUnzipCursor from '../DownloadAndUnzipCursor/DownloadAndUnzipCursor.ts'
import * as GetExtensionsDir from '../GetExtensionsDir/GetExtensionsDir.ts'
import * as GetUserDataDir from '../GetUserDataDir/GetUserDataDir.ts'
import * as GetVsCodeArgs from '../GetVsCodeArgs/GetVsCodeArgs.ts'
import * as GetVsCodeEnv from '../GetVsCodeEnv/GetVsCodeEnv.ts'
import * as GetVscodeRuntimeDir from '../GetVscodeRuntimeDir/GetVscodeRuntimeDir.ts'
import * as LaunchElectron from '../LaunchElectron/LaunchElectron.ts'
import { join } from '../Path/Path.ts'
import * as Root from '../Root/Root.ts'
import { VError } from '../VError/VError.ts'

export const launchCursor = async ({
  addDisposable,
  cursorVersion,
  cwd,
  enableExtensions,
  enableProxy,
  headlessMode,
  inspectExtensions,
  inspectExtensionsPort,
  inspectPtyHost,
  inspectPtyHostPort,
  inspectSharedProcess,
  inspectSharedProcessPort,
  useProxyMock,
  vscodePath,
}) => {
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
    const binaryPath = vscodePath || (await DownloadAndUnzipCursor.downloadAndUnzipCursor(cursorVersion))
    const userDataDir = GetUserDataDir.getUserDataDir()
    const extensionsDir = GetExtensionsDir.getExtensionsDir()
    await rm(extensionsDir, { force: true, recursive: true })
    await mkdir(extensionsDir)
    const defaultSettingsSourcePath = DefaultVscodeSettingsPath.defaultVsCodeSettingsPath
    const settingsPath = join(userDataDir, 'User', 'settings.json')
    await mkdir(dirname(settingsPath), { recursive: true })
    await copyFile(defaultSettingsSourcePath, settingsPath)

    const args = GetVsCodeArgs.getVscodeArgs({
      enableExtensions,
      enableProxy,
      extensionsDir,
      extraLaunchArgs: [testWorkspacePath],
      inspectExtensions,
      inspectExtensionsPort,
      inspectPtyHost,
      inspectPtyHostPort,
      inspectSharedProcess,
      inspectSharedProcessPort,
      userDataDir,
    })
    const env = GetVsCodeEnv.getVsCodeEnv({
      processEnv: process.env,
      runtimeDir,
    })
    const { child } = await LaunchElectron.launchElectron({
      addDisposable,
      args,
      cliPath: binaryPath,
      cwd,
      env,
      headlessMode,
    })
    return {
      child,
    }
  } catch (error) {
    throw new VError(error, `Failed to launch Cursor`)
  }
}
