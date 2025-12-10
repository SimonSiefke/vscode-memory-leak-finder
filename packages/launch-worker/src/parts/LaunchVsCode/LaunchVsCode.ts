import { copyFile, mkdir, rm } from 'node:fs/promises'
import { dirname } from 'node:path'
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
  headlessMode,
  cwd,
  vscodeVersion,
  vscodePath,
  commit,
  addDisposable,
  inspectSharedProcess,
  inspectExtensions,
  inspectPtyHost,
  enableExtensions,
  inspectPtyHostPort,
  inspectSharedProcessPort,
  inspectExtensionsPort,
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
    const binaryPath = await GetBinaryPath.getBinaryPath(vscodeVersion, vscodePath, commit)
    const userDataDir = GetUserDataDir.getUserDataDir()
    const extensionsDir = GetExtensionsDir.getExtensionsDir()
    await rm(extensionsDir, { recursive: true, force: true })
    await mkdir(extensionsDir)
    const defaultSettingsSourcePath = DefaultVscodeSettingsPath.defaultVsCodeSettingsPath
    const settingsPath = join(userDataDir, 'User', 'settings.json')
    await mkdir(dirname(settingsPath), { recursive: true })

    // Copy default settings, then merge with any existing proxy settings
    await copyFile(defaultSettingsSourcePath, settingsPath)

    // Check if proxy state exists and merge proxy settings
    try {
      const { readFile, writeFile } = await import('fs/promises')
      const { existsSync } = await import('fs')
      const proxyStateFile = join(Root.root, '.vscode-proxy-state.json')

      if (existsSync(proxyStateFile)) {
        const proxyStateContent = await readFile(proxyStateFile, 'utf8')
        const proxyState = JSON.parse(proxyStateContent)

        if (proxyState.proxyUrl) {
          const settingsContent = await readFile(settingsPath, 'utf8')
          const settings = JSON.parse(settingsContent)
          settings['http.proxy'] = proxyState.proxyUrl
          settings['http.proxyStrictSSL'] = false
          await writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8')
          console.log(`[LaunchVsCode] Merged proxy settings: ${proxyState.proxyUrl}`)
          console.log(`[LaunchVsCode] Settings file written to: ${settingsPath}`)
          
          // Verify settings were written correctly
          const verifyContent = await readFile(settingsPath, 'utf8')
          const verifySettings = JSON.parse(verifyContent)
          console.log(`[LaunchVsCode] Verified proxy setting: ${verifySettings['http.proxy']}`)
        }
      }
    } catch (error) {
      // Ignore errors merging proxy settings
      console.error('[LaunchVsCode] Error merging proxy settings:', error)
    }
    const args = GetVsCodeArgs.getVscodeArgs({
      userDataDir,
      extensionsDir,
      extraLaunchArgs: [testWorkspacePath],
      inspectSharedProcess,
      inspectExtensions,
      inspectPtyHost,
      enableExtensions,
      inspectPtyHostPort,
      inspectSharedProcessPort,
      inspectExtensionsPort,
    })
    const env = await GetVsCodeEnv.getVsCodeEnv({ runtimeDir, processEnv: process.env })
    const { child } = await LaunchElectron.launchElectron({
      cliPath: binaryPath,
      args,
      headlessMode,
      cwd,
      env,
      addDisposable,
    })
    return {
      child,
    }
  } catch (error) {
    throw new VError(error, `Failed to launch VSCode`)
  }
}
