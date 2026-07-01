import { copyFile, mkdir, rm, stat } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { CallgrindConfig } from '../CallgrindConfig/CallgrindConfig.ts'
import * as ClearExtensionsDirIfEmpty from '../ClearExtensionsDirIfEmpty/ClearExtensionsDirIfEmpty.ts'
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
import * as RestoreUserDataDir from '../RestoreUserDataDir/RestoreUserDataDir.ts'
import * as Root from '../Root/Root.ts'
import { VError } from '../VError/VError.ts'

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

const prepareCursorLaunch = async ({
  clearExtensions,
  cursorVersion,
  downloadUserDataZipFileToken,
  downloadUserDataZipFileUrl,
  vscodePath,
}: {
  clearExtensions: boolean
  cursorVersion: string
  downloadUserDataZipFileToken: string
  downloadUserDataZipFileUrl: string
  vscodePath: string | undefined
}) => {
  const shouldRestoreUserDataDir = downloadUserDataZipFileUrl !== ''
  if (!downloadUserDataZipFileUrl && downloadUserDataZipFileToken) {
    throw new Error('download user data zip file url is required when a token is provided')
  }
  const testWorkspacePath = join(Root.root, '.cursor-test-workspace')
  await CreateTestWorkspace.createTestWorkspace(testWorkspacePath)
  const runtimeDir = GetVscodeRuntimeDir.getVscodeRuntimeDir()
  const binaryPath = vscodePath || (await DownloadAndUnzipCursor.downloadAndUnzipCursor(cursorVersion))
  const userDataDir = GetUserDataDir.getUserDataDir()
  const extensionsDir = GetExtensionsDir.getExtensionsDir()
  if (shouldRestoreUserDataDir) {
    await RestoreUserDataDir.restoreUserDataDir({
      downloadUserDataZipFileToken,
      downloadUserDataZipFileUrl,
      userDataDir,
    })
  }
  if (clearExtensions) {
    await rm(extensionsDir, { force: true, recursive: true })
    await mkdir(extensionsDir)
  } else {
    await ClearExtensionsDirIfEmpty.clearExtensionsDirIfEmpty(extensionsDir)
  }
  const defaultSettingsSourcePath = DefaultVscodeSettingsPath.defaultVsCodeSettingsPath
  const settingsPath = join(userDataDir, 'User', 'settings.json')
  await mkdir(dirname(settingsPath), { recursive: true })
  if (!shouldRestoreUserDataDir || !(await pathExists(settingsPath))) {
    await copyFile(defaultSettingsSourcePath, settingsPath)
  }
  return {
    binaryPath,
    extensionsDir,
    runtimeDir,
    testWorkspacePath,
    userDataDir,
  }
}

export const setupCursor = async ({
  clearExtensions,
  cursorVersion,
  downloadUserDataZipFileToken,
  downloadUserDataZipFileUrl,
  vscodePath,
}: {
  clearExtensions: boolean
  cursorVersion: string
  downloadUserDataZipFileToken: string
  downloadUserDataZipFileUrl: string
  vscodePath: string | undefined
}): Promise<void> => {
  try {
    await prepareCursorLaunch({
      clearExtensions,
      cursorVersion,
      downloadUserDataZipFileToken,
      downloadUserDataZipFileUrl,
      vscodePath,
    })
  } catch (error) {
    throw new VError(error, `Failed to set up Cursor`)
  }
}

export const launchCursor = async ({
  addDisposable,
  callgrindConfig,
  clearExtensions,
  cursorVersion,
  cwd,
  downloadUserDataZipFileToken,
  downloadUserDataZipFileUrl,
  enableExtensions,
  enableProxy,
  headlessMode,
  inspectExtensions,
  inspectExtensionsPort,
  inspectPtyHost,
  inspectPtyHostPort,
  inspectSharedProcess,
  inspectSharedProcessPort,
  proxyTestFolderName: _proxyTestFolderName,
  useProxyMock,
  vscodePath,
}: {
  addDisposable: (fn: () => Promise<void> | void) => void
  callgrindConfig: CallgrindConfig
  clearExtensions: boolean
  cursorVersion: string
  cwd: string
  downloadUserDataZipFileToken: string
  downloadUserDataZipFileUrl: string
  enableExtensions: boolean
  enableProxy: boolean
  headlessMode: boolean
  inspectExtensions: boolean
  inspectExtensionsPort: number
  inspectPtyHost: boolean
  inspectPtyHostPort: number
  inspectSharedProcess: boolean
  inspectSharedProcessPort: number
  proxyTestFolderName?: string
  useProxyMock: boolean
  vscodePath?: string
}) => {
  try {
    const { binaryPath, extensionsDir, runtimeDir, testWorkspacePath, userDataDir } = await prepareCursorLaunch({
      clearExtensions,
      cursorVersion,
      downloadUserDataZipFileToken,
      downloadUserDataZipFileUrl,
      vscodePath,
    })

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
      userDataDir,
    })
    const { child, pid } = await LaunchElectron.launchElectron({
      addDisposable,
      args,
      callgrindConfig,
      cliPath: binaryPath,
      cwd,
      env,
      headlessMode,
      platform: process.platform,
    })
    return {
      child,
      pid,
    }
  } catch (error) {
    throw new VError(error, `Failed to launch Cursor`)
  }
}
