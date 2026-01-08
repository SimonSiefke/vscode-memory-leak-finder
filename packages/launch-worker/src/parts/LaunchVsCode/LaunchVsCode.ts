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
import * as ProxyWorker from '../ProxyWorker/ProxyWorker.ts'

export const launchVsCode = async ({
  addDisposable,
  arch,
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
  platform,
  updateUrl,
  useProxyMock,
  vscodePath,
  vscodeVersion,
}: {
  addDisposable: (fn: () => Promise<void> | void) => void
  arch: string
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
  platform: string
  useProxyMock: boolean
  updateUrl: string
  vscodePath: string
  vscodeVersion: string
}) => {
  console.log(`[LaunchVsCode] enableProxy parameter: ${enableProxy} (type: ${typeof enableProxy})`)
  console.log(`[LaunchVsCode] useProxyMock parameter: ${useProxyMock} (type: ${typeof useProxyMock})`)
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
    const binaryPath = await GetBinaryPath.getBinaryPath(platform, arch, vscodeVersion, vscodePath, commit, insidersCommit, updateUrl)
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

    // Copy default settings
    await copyFile(defaultSettingsSourcePath, settingsPath)

    // Start proxy server if enabled
    // Note: enableProxy might be undefined if RPC call doesn't pass it correctly
    // Default to false if undefined
    const shouldEnableProxy = enableProxy === true
    console.log(`[LaunchVsCode] shouldEnableProxy: ${shouldEnableProxy} (enableProxy was: ${enableProxy})`)
    let proxyEnvVars: Record<string, string> = {}
    let proxyServer: { port: number; url: string } | null = null
    let proxyWorkerRpc: Awaited<ReturnType<typeof ProxyWorker.launch>> | null = null
    if (shouldEnableProxy) {
      try {
        console.log('[LaunchVsCode] Starting proxy worker...')
        proxyWorkerRpc = await ProxyWorker.launch()
        proxyServer = await proxyWorkerRpc.invoke('Proxy.setupProxy', 0, useProxyMock, settingsPath)

        // Get proxy environment variables
        if (proxyServer) {
          proxyEnvVars = await proxyWorkerRpc.invoke('Proxy.getProxyEnvVars', proxyServer.url)
        }

        // Keep proxy server alive
        if (addDisposable && proxyWorkerRpc) {
          addDisposable(async () => {
            console.log('[LaunchVsCode] Disposing proxy server...')
            await proxyWorkerRpc!.invoke('Proxy.disposeProxyServer')
            await proxyWorkerRpc!.dispose()
          })
        }
      } catch (error) {
        console.error('[LaunchVsCode] Error setting up proxy:', error)
        // Continue even if proxy setup fails
      }
    }
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
      proxyEnvVars,
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
