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
import * as HttpProxyServer from '../HttpProxyServer/HttpProxyServer.ts'

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
  enableProxy,
  useProxyMock,
}) => {
  console.log(`[LaunchVsCode] enableProxy parameter: ${enableProxy} (type: ${typeof enableProxy})`)
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

    // Copy default settings
    await copyFile(defaultSettingsSourcePath, settingsPath)

    // Start proxy server if enabled
    // Note: enableProxy might be undefined if RPC call doesn't pass it correctly
    // Default to false if undefined
    const shouldEnableProxy = enableProxy === true
    console.log(`[LaunchVsCode] shouldEnableProxy: ${shouldEnableProxy} (enableProxy was: ${enableProxy})`)
    let proxyServer: { port: number; url: string; dispose: () => Promise<void> } | null = null
    if (shouldEnableProxy) {
      try {
        console.log('[LaunchVsCode] Starting proxy server...')
        proxyServer = await HttpProxyServer.createHttpProxyServer(0, useProxyMock)
        console.log(`[LaunchVsCode] Proxy server started on ${proxyServer.url} (port ${proxyServer.port})`)

        // Update settings
        const { readFile, writeFile } = await import('fs/promises')
        const settingsContent = await readFile(settingsPath, 'utf8')
        const settings = JSON.parse(settingsContent)
        settings['http.proxy'] = proxyServer.url
        settings['http.proxyStrictSSL'] = false
        await writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8')
        console.log(`[LaunchVsCode] Proxy configured: ${proxyServer.url}`)

        // Keep proxy server alive
        if (addDisposable && proxyServer) {
          addDisposable(async () => {
            console.log('[LaunchVsCode] Disposing proxy server...')
            await proxyServer!.dispose()
          })
        }

        // Wait a bit to ensure proxy server is ready
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error('[LaunchVsCode] Error setting up proxy:', error)
        // Continue even if proxy setup fails
      }
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
      enableProxy: shouldEnableProxy,
    })
    const env = await GetVsCodeEnv.getVsCodeEnv({
      runtimeDir,
      processEnv: process.env,
      proxyUrl: proxyServer ? proxyServer.url : null,
    })
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
