import { copyFile, mkdir, rm, stat } from 'node:fs/promises'
import { dirname } from 'node:path'
import * as AssertLocalVsCodeBuildReady from '../AssertLocalVsCodeBuildReady/AssertLocalVsCodeBuildReady.ts'
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
import * as ProxyWorker from '../ProxyWorker/ProxyWorker.ts'
import * as RemoveVscodeBackups from '../RemoveVscodeBackups/RemoveVscodeBackups.ts'
import * as RemoveVscodeGlobalStorage from '../RemoveVscodeGlobalStorage/RemoveVscodeGlobalStorage.ts'
import * as RemoveVscodeWorkspaceStorage from '../RemoveVscodeWorkspaceStorage/RemoveVscodeWorkspaceStorage.ts'
import * as RestoreAllMockDataArchive from '../RestoreAllMockDataArchive/RestoreAllMockDataArchive.ts'
import * as RestoreZipArchive from '../RestoreZipArchive/RestoreZipArchive.ts'
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

const restoreProxyArtifacts = async (downloadToken: string): Promise<void> => {
  const downloadAllMockDataZipFileUrl = process.env.DOWNLOAD_ALL_MOCK_DATA_ZIP_FILE_URL || ''
  const downloadVscodeMockRequestsZipFileUrl = process.env.DOWNLOAD_VSCODE_MOCK_REQUESTS_ZIP_FILE_URL || ''
  const downloadVscodeProxyCertsZipFileUrl = process.env.DOWNLOAD_VSCODE_PROXY_CERTS_ZIP_FILE_URL || ''
  const downloadVscodeRequestsZipFileUrl = process.env.DOWNLOAD_VSCODE_REQUESTS_ZIP_FILE_URL || ''

  if (downloadAllMockDataZipFileUrl) {
    await RestoreAllMockDataArchive.restoreAllMockDataArchive({
      downloadToken,
      downloadUrl: downloadAllMockDataZipFileUrl,
    })
    return
  }

  if (downloadVscodeMockRequestsZipFileUrl) {
    await RestoreZipArchive.restoreZipArchive({
      archiveLabel: 'vscode mock requests',
      downloadToken,
      downloadUrl: downloadVscodeMockRequestsZipFileUrl,
      targetDir: join(Root.root, '.vscode-mock-requests'),
    })
  }

  if (downloadVscodeProxyCertsZipFileUrl) {
    await RestoreZipArchive.restoreZipArchive({
      archiveLabel: 'vscode proxy certs',
      downloadToken,
      downloadUrl: downloadVscodeProxyCertsZipFileUrl,
      targetDir: join(Root.root, '.vscode-proxy-certs'),
    })
  }

  if (downloadVscodeRequestsZipFileUrl) {
    await RestoreZipArchive.restoreZipArchive({
      archiveLabel: 'vscode requests',
      downloadToken,
      downloadUrl: downloadVscodeRequestsZipFileUrl,
      targetDir: join(Root.root, '.vscode-requests'),
    })
  }
}

const prepareVsCodeLaunch = async ({
  arch,
  clearExtensions,
  commit,
  downloadUserDataZipFileToken,
  downloadUserDataZipFileUrl,
  enableExtensions,
  insidersCommit,
  platform,
  updateUrl,
  vscodePath,
  vscodeVersion,
}: {
  arch: string
  clearExtensions: boolean
  commit: string
  downloadUserDataZipFileToken: string
  downloadUserDataZipFileUrl: string
  enableExtensions: boolean
  insidersCommit: string
  platform: string
  updateUrl: string
  vscodePath: string
  vscodeVersion: string
}) => {
  const downloadAllMockDataZipFileUrl = process.env.DOWNLOAD_ALL_MOCK_DATA_ZIP_FILE_URL || ''
  const shouldRestoreUserDataDir = downloadUserDataZipFileUrl !== '' || downloadAllMockDataZipFileUrl !== ''
  if (!shouldRestoreUserDataDir && downloadUserDataZipFileToken) {
    throw new Error('download user data zip file url is required when a token is provided')
  }
  const testWorkspacePath = join(Root.root, '.vscode-test-workspace')
  await CreateTestWorkspace.createTestWorkspace(testWorkspacePath)
  if (!shouldRestoreUserDataDir) {
    await RemoveVscodeWorkspaceStorage.removeVsCodeWorkspaceStorage()
  }
  if (IsCi.isCi && !shouldRestoreUserDataDir) {
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
  await AssertLocalVsCodeBuildReady.assertLocalVsCodeBuildReady(binaryPath, enableExtensions)
  const userDataDir = GetUserDataDir.getUserDataDir()
  const extensionsDir = GetExtensionsDir.getExtensionsDir()
  if (downloadUserDataZipFileUrl) {
    await RestoreUserDataDir.restoreUserDataDir({
      downloadUserDataZipFileToken,
      downloadUserDataZipFileUrl,
      userDataDir,
    })
  }
  await restoreProxyArtifacts(downloadUserDataZipFileToken)
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
    settingsPath,
    testWorkspacePath,
    userDataDir,
  }
}

export const setupVsCode = async ({
  arch,
  clearExtensions,
  commit,
  downloadUserDataZipFileToken,
  downloadUserDataZipFileUrl,
  enableExtensions,
  insidersCommit,
  platform,
  updateUrl,
  vscodePath,
  vscodeVersion,
}: {
  arch: string
  clearExtensions: boolean
  commit: string
  downloadUserDataZipFileToken: string
  downloadUserDataZipFileUrl: string
  enableExtensions: boolean
  insidersCommit: string
  platform: string
  updateUrl: string
  vscodePath: string
  vscodeVersion: string
}): Promise<void> => {
  try {
    await prepareVsCodeLaunch({
      arch,
      clearExtensions,
      commit,
      downloadUserDataZipFileToken,
      downloadUserDataZipFileUrl,
      enableExtensions,
      insidersCommit,
      platform,
      updateUrl,
      vscodePath,
      vscodeVersion,
    })
  } catch (error) {
    throw new VError(error, `Failed to set up VSCode`)
  }
}

export const launchVsCode = async ({
  addDisposable,
  arch,
  clearExtensions,
  commit,
  cwd,
  downloadUserDataZipFileToken,
  downloadUserDataZipFileUrl,
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
  proxyTestFolderName,
  useProxyMock,
  updateUrl,
  vscodePath,
  vscodeVersion,
}: {
  addDisposable: (fn: () => Promise<void> | void) => void
  arch: string
  clearExtensions: boolean
  commit: string
  cwd: string
  downloadUserDataZipFileToken: string
  downloadUserDataZipFileUrl: string
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
  proxyTestFolderName: string
  useProxyMock: boolean
  updateUrl: string
  vscodePath: string
  vscodeVersion: string
}) => {
  if (enableProxy) {
    console.log(`[LaunchVsCode] enableProxy parameter: ${enableProxy} (type: ${typeof enableProxy})`)
    console.log(`[LaunchVsCode] useProxyMock parameter: ${useProxyMock} (type: ${typeof useProxyMock})`)
  }
  try {
    const { binaryPath, extensionsDir, runtimeDir, settingsPath, testWorkspacePath, userDataDir } = await prepareVsCodeLaunch({
      arch,
      clearExtensions,
      commit,
      downloadUserDataZipFileToken,
      downloadUserDataZipFileUrl,
      enableExtensions,
      insidersCommit,
      platform,
      updateUrl,
      vscodePath,
      vscodeVersion,
    })

    // Start proxy server if enabled
    // Note: enableProxy might be undefined if RPC call doesn't pass it correctly
    // Default to false if undefined
    const shouldEnableProxy = enableProxy === true
    if (shouldEnableProxy) {
      console.log(`[LaunchVsCode] shouldEnableProxy: ${shouldEnableProxy} (enableProxy was: ${enableProxy})`)
    }
    let proxyEnvVars: Record<string, string> = {}
    let proxyServer: { port: number; url: string } | null = null
    let proxyWorkerRpc: Awaited<ReturnType<typeof ProxyWorker.launch>> | null = null
    if (shouldEnableProxy) {
      try {
        console.log('[LaunchVsCode] Starting proxy worker...')
        proxyWorkerRpc = await ProxyWorker.launch()
        proxyServer = await proxyWorkerRpc.invoke('Proxy.setupProxy', 0, useProxyMock, settingsPath, proxyTestFolderName)

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
      userDataDir,
    })

    const { child, pid } = await LaunchElectron.launchElectron({
      addDisposable,
      args,
      cliPath: binaryPath,
      cwd,
      env,
      headlessMode,
    })
    return {
      binaryPath,
      child,
      pid,
      proxyWorkerRpc,
    }
  } catch (error) {
    throw new VError(error, `Failed to launch VSCode`)
  }
}
