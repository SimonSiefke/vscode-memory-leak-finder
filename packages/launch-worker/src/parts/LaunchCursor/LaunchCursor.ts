import { copyFile, mkdir, readdir, rm, stat } from 'node:fs/promises'
import { dirname } from 'node:path'
import * as CreateTestWorkspace from '../CreateTestWorkspace/CreateTestWorkspace.ts'
import * as DefaultVscodeSettingsPath from '../DefaultVscodeSettingsPath/DefaultVsCodeSettingsPath.ts'
import * as DownloadAndUnzipCursor from '../DownloadAndUnzipCursor/DownloadAndUnzipCursor.ts'
import * as ClearExtensionsDirIfEmpty from '../ClearExtensionsDirIfEmpty/ClearExtensionsDirIfEmpty.ts'
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
  clearExtensions,
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
}: {
  addDisposable: (fn: () => Promise<void> | void) => void
  clearExtensions: boolean
  cursorVersion: string
  cwd: string
  enableExtensions: boolean
  enableProxy: boolean
  headlessMode: boolean
  inspectExtensions: boolean
  inspectExtensionsPort: number
  inspectPtyHost: boolean
  inspectPtyHostPort: number
  inspectSharedProcess: boolean
  inspectSharedProcessPort: number
  useProxyMock: boolean
  vscodePath?: string
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
    if (clearExtensions) {
      await rm(extensionsDir, { force: true, recursive: true })
      await mkdir(extensionsDir)
    } else {
      // Only clear extensions directory if it's empty or doesn't exist
      // This preserves installed extensions across test runs
      try {
        const entries = await readdir(extensionsDir)
        // Check if there are any extension directories (not just files)
        let hasExtensions = false
        for (const entry of entries) {
          const entryPath = join(extensionsDir, entry)
          const entryStat = await stat(entryPath)
          if (entryStat.isDirectory()) {
            hasExtensions = true
            break
          }
        }
        if (!hasExtensions) {
          await rm(extensionsDir, { force: true, recursive: true })
          await mkdir(extensionsDir)
        }
      } catch {
        // Directory doesn't exist, create it
        await mkdir(extensionsDir, { recursive: true })
      }
    }
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
