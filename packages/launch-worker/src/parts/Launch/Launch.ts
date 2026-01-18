import { createPipeline } from '../CreatePipeline/CreatePipeline.ts'
import * as Disposables from '../Disposables/Disposables.ts'
import * as FunctionTrackerState from '../FunctionTrackerState/FunctionTrackerState.ts'
import * as LaunchIde from '../LaunchIde/LaunchIde.ts'
import { launchInitializationWorker } from '../LaunchInitializationWorker/LaunchInitializationWorker.ts'
import * as LaunchFunctionTrackerWorker from '../LaunchFunctionTrackerWorker/LaunchFunctionTrackerWorker.ts'

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
  await using rpc = await launchInitializationWorker()
  if (pid === undefined) {
    throw new Error(`pid is undefined after launching IDE`)
  }
  const { devtoolsWebSocketUrl, electronObjectId, monkeyPatchedElectronId, sessionId, targetId, utilityContext, webSocketUrl } =
    await rpc.invokeAndTransfer(
      'Initialize.prepare',
      headlessMode,
      attachedToPageTimeout,
      port.port,
      parsedVersion,
      trackFunctions,
      connectionId,
      measureId,
      pid,
    )

  // Launch function-tracker worker if tracking is enabled
  // Connect it AFTER the page is created but BEFORE undoing monkey patch
  let functionTrackerRpc: Awaited<ReturnType<typeof LaunchFunctionTrackerWorker.launchFunctionTrackerWorker>> | null = null
  if (trackFunctions) {
    functionTrackerRpc = await LaunchFunctionTrackerWorker.launchFunctionTrackerWorker()
    // Store in state so we can access it later to get statistics
    FunctionTrackerState.setFunctionTrackerRpc(functionTrackerRpc)
    // Connect function-tracker devtools BEFORE undoing monkey patch
    // This ensures the window is paused and we can intercept network requests
    await functionTrackerRpc.invoke('FunctionTracker.connectDevtools', devtoolsWebSocketUrl, webSocketUrl, connectionId, measureId)
    // Now undo the monkey patch to continue loading the window
    // The function-tracker is already connected and will intercept network requests
    await rpc.invoke('Initialize.connectFunctionTracker')
  }

  // Note: functionTrackerRpc cannot be transferred via postMessage, so we don't return it
  // It will be disposed separately if needed
  return {
    devtoolsWebSocketUrl,
    electronObjectId,
    functionTrackerRpc: undefined, // Cannot be transferred via postMessage
    parsedVersion,
    pid,
    sessionId,
    targetId,
    utilityContext,
    webSocketUrl,
  }
}
