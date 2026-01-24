import { join } from 'node:path'
import { createPipeline } from '../CreatePipeline/CreatePipeline.ts'
import * as Disposables from '../Disposables/Disposables.ts'
import * as GetBinaryPath from '../GetBinaryPath/GetBinaryPath.ts'
import * as LaunchIde from '../LaunchIde/LaunchIde.ts'
import { launchInitializationWorker } from '../LaunchInitializationWorker/LaunchInitializationWorker.ts'
import * as Root from '../Root/Root.ts'

export interface LaunchOptions {
  readonly arch: string
  readonly attachedToPageTimeout: number
  readonly canUseIdleCallback: boolean
  readonly clearExtensions: boolean
  readonly commit: string
  readonly connectionId: number
  readonly cwd: string
  readonly enableExtensions: boolean
  readonly enableProxy: boolean
  readonly headlessMode: boolean
  readonly ide: string
  readonly insidersCommit: string
  readonly inspectExtensions: boolean
  readonly inspectExtensionsPort: number
  readonly inspectPtyHost: boolean
  readonly inspectPtyHostPort: number
  readonly inspectSharedProcess: boolean
  readonly inspectSharedProcessPort: number
  readonly isFirstConnection: boolean
  readonly measureId: string
  readonly platform: string
  readonly trackFunctions: boolean
  readonly openDevtools: boolean
  readonly updateUrl: string
  readonly useProxyMock: boolean
  readonly vscodePath: string
  readonly vscodeVersion: string
}

export const launch = async (options: LaunchOptions): Promise<any> => {
  const {
    arch,
    attachedToPageTimeout,
    clearExtensions,
    commit,
    connectionId,
    cwd,
    enableExtensions,
    enableProxy,
    headlessMode,
    ide,
    insidersCommit,
    inspectExtensions,
    inspectExtensionsPort,
    inspectPtyHost,
    inspectPtyHostPort,
    inspectSharedProcess,
    inspectSharedProcessPort,
    measureId,
    platform,
    trackFunctions,
    openDevtools,
    updateUrl,
    useProxyMock,
    vscodePath,
    vscodeVersion,
  } = options
  const { child, parsedVersion, pid } = await LaunchIde.launchIde({
    addDisposable: Disposables.add,
    arch,
    clearExtensions,
    commit,
    cwd,
    enableExtensions,
    enableProxy,
    headlessMode,
    ide,
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
  })
  // TODO maybe can do the intialization also here, without needing a separate worker
  await using port = createPipeline(child.stderr)

  // Compute binary path and pre-generated workbench path for function tracking
  let binaryPath: string | null = null
  let preGeneratedWorkbenchPath: string | null = null
  if (trackFunctions) {
    binaryPath = await GetBinaryPath.getBinaryPath(platform, arch, vscodeVersion, vscodePath, commit, insidersCommit, updateUrl)
    preGeneratedWorkbenchPath = join(Root.root, '.vscode-workbench-tracked', 'workbench.desktop.main.js')
  }

  await using rpc = await launchInitializationWorker()
  if (pid === undefined) {
    throw new Error(`pid is undefined after launching IDE`)
  }
  const { devtoolsWebSocketUrl, electronObjectId, sessionId, targetId, utilityContext, webSocketUrl } = await rpc.invokeAndTransfer(
    'Initialize.prepare',
    headlessMode,
    attachedToPageTimeout,
    port.port,
    parsedVersion,
    trackFunctions,
    openDevtools,
    connectionId,
    measureId,
    pid,
    preGeneratedWorkbenchPath,
    binaryPath,
  )

  return {
    devtoolsWebSocketUrl,
    electronObjectId,
    parsedVersion,
    pid,
    sessionId,
    targetId,
    utilityContext,
    webSocketUrl,
  }
}
