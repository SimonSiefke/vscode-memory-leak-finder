import { copyFile, mkdir, rm } from 'node:fs/promises'
import { dirname } from 'node:path'
import * as ClearExtensionsDirIfEmpty from '../ClearExtensionsDirIfEmpty/ClearExtensionsDirIfEmpty.ts'
import * as CreateTestWorkspace from '../CreateTestWorkspace/CreateTestWorkspace.ts'
import * as DefaultVscodeSettingsPath from '../DefaultVscodeSettingsPath/DefaultVsCodeSettingsPath.ts'
import * as GetBinaryPath from '../GetBinaryPath/GetBinaryPath.ts'
import * as GetExtensionsDir from '../GetExtensionsDir/GetExtensionsDir.ts'
import * as GetUserDataDir from '../GetUserDataDir/GetUserDataDir.ts'
import * as GetVsCodeArgs from '../GetVsCodeArgs/GetVsCodeArgs.ts'
import * as GetVsCodeEnv from '../GetVsCodeEnv/GetVsCodeEnv.ts'
import * as GetVscodeRuntimeDir from '../GetVscodeRuntimeDir/GetVscodeRuntimeDir.ts'
import * as IsCi from '../IsCi/IsCi.ts'
import * as LaunchElectron from '../LaunchElectron/LaunchElectron.ts'
import { join } from '../Path/Path.ts'
import * as RemoveVscodeBackups from '../RemoveVscodeBackups/RemoveVscodeBackups.ts'
import * as RemoveVscodeGlobalStorage from '../RemoveVscodeGlobalStorage/RemoveVscodeGlobalStorage.ts'
import * as RemoveVscodeWorkspaceStorage from '../RemoveVscodeWorkspaceStorage/RemoveVscodeWorkspaceStorage.ts'
import * as Root from '../Root/Root.ts'
import { VError } from '../VError/VError.ts'

export const launchVsCode = async ({
  addDisposable,
  clearExtensions,
  commit,
  cwd,
  enableExtensions,
  enableProxy,
  headlessMode,
  insidersCommit,
  inspectExtensions,
  inspectExtensionsPort,
  inspectPtyHost,
  inspectPtyHostPort,
  inspectSharedProcess,
  inspectSharedProcessPort,
  useProxyMock,
  vscodePath,
  vscodeVersion,
}: {
  addDisposable: (fn: () => Promise<void> | void) => void
  clearExtensions: boolean
  commit: string
  cwd: string
  enableExtensions: boolean
  enableProxy: boolean
  headlessMode: boolean
  insidersCommit: string
  inspectExtensions: boolean
  inspectExtensionsPort: number
  inspectPtyHost: boolean
  inspectPtyHostPort: number
  inspectSharedProcess: boolean
  inspectSharedProcessPort: number
  useProxyMock: boolean
  vscodePath: string
  vscodeVersion: string
}) => {
  try {
    const testWorkspacePath = join(Root.root, '.vscode-test-workspace')
    await CreateTestWorkspace.createTestWorkspace(testWorkspacePath)
    await RemoveVscodeWorkspaceStorage.removeVsCodeWorkspaceStorage()
    if (IsCi.isCi) {
      await RemoveVscodeGlobalStorage.removeVsCodeGlobalStorage()
    }
    await RemoveVscodeBackups.removeVscodeBackups()
    const runtimeDir = GetVscodeRuntimeDir.getVscodeRuntimeDir()
    if (runtimeDir) {
      await mkdir(runtimeDir, { recursive: true })
    }
    const sourceMapDir = join(Root.root, '.vscode-source-maps')
    await mkdir(sourceMapDir, { recursive: true })
    const sourceMapCacheDir = join(Root.root, '.vscode-resolve-source-map-cache')
    await mkdir(sourceMapCacheDir, { recursive: true })
    const sourcesDir = join(Root.root, '.vscode-sources')
    await mkdir(sourcesDir, { recursive: true })
    const binaryPath = await GetBinaryPath.getBinaryPath(vscodeVersion, vscodePath, commit, insidersCommit)
    const userDataDir = GetUserDataDir.getUserDataDir()
    const extensionsDir = GetExtensionsDir.getExtensionsDir()
    if (clearExtensions) {
      await rm(extensionsDir, { force: true, recursive: true })
      await mkdir(extensionsDir)
    } else {
      await ClearExtensionsDirIfEmpty.clearExtensionsDirIfEmpty(extensionsDir)
    }
    const defaultSettingsSourcePath = DefaultVscodeSettingsPath.defaultVsCodeSettingsPath
    const settingsPath = join(userDataDir, 'User', 'settings.json')
    await mkdir(dirname(settingsPath), { recursive: true })
    await copyFile(defaultSettingsSourcePath, settingsPath)
    const args = GetVsCodeArgs.getVscodeArgs({
      enableExtensions,
      enableProxy: enableProxy,
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
    throw new VError(error, `Failed to launch VSCode`)
  }
}
