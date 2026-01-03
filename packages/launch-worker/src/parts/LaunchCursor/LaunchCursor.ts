import { copyFile, mkdir, rm } from 'node:fs/promises'
import { dirname } from 'node:path'
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
import * as Root from '../Root/Root.ts'
import { VError } from '../VError/VError.ts'
import * as ProxyWorker from '../ProxyWorker/ProxyWorker.ts'

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
  console.log(`[LaunchCursor] enableProxy parameter: ${enableProxy} (type: ${typeof enableProxy})`)
  console.log(`[LaunchCursor] useProxyMock parameter: ${useProxyMock} (type: ${typeof useProxyMock})`)
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
      await ClearExtensionsDirIfEmpty.clearExtensionsDirIfEmpty(extensionsDir)
    }
    const defaultSettingsSourcePath = DefaultVscodeSettingsPath.defaultVsCodeSettingsPath
    const settingsPath = join(userDataDir, 'User', 'settings.json')
    await mkdir(dirname(settingsPath), { recursive: true })
    await copyFile(defaultSettingsSourcePath, settingsPath)

    // Start proxy server if enabled
    let proxyEnvVars: Record<string, string> = {}
    let proxyServer: { port: number; url: string } | null = null
    let proxyWorkerRpc: Awaited<ReturnType<typeof ProxyWorker.launch>> | null = null
    if (enableProxy) {
      try {
        console.log('[LaunchCursor] Starting proxy worker...')
        proxyWorkerRpc = await ProxyWorker.launch()
        proxyServer = await proxyWorkerRpc.invoke('Proxy.setupProxy', 0, useProxyMock, settingsPath)

        // Get proxy environment variables
        if (proxyServer) {
          proxyEnvVars = await proxyWorkerRpc.invoke('Proxy.getProxyEnvVars', proxyServer.url)
        }

        // Keep proxy server alive
        if (addDisposable && proxyWorkerRpc) {
          addDisposable(async () => {
            console.log('[LaunchCursor] Disposing proxy server...')
            await proxyWorkerRpc!.invoke('Proxy.disposeProxyServer')
            await proxyWorkerRpc!.dispose()
          })
        }
      } catch (error) {
        console.error('[LaunchCursor] Error setting up proxy:', error)
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
    throw new VError(error, `Failed to launch Cursor`)
  }
}
