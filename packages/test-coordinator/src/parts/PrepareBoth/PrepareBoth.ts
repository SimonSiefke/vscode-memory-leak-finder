import { launchInitializationWorker } from '../LaunchInitializationWorker/LaunchInitializationWorker.ts'

export interface PrepareBothResult {
  readonly webSocketUrl: string
  readonly devtoolsWebSocketUrl: string
  readonly electronObjectId: string
  readonly parsedVersion: string
  readonly utilityContext: any
  readonly sessionId: string
  readonly targetId: string
  readonly initializationWorkerRpc: any
}

export const prepareBoth = async (
  headlessMode: boolean,
  cwd: string,
  ide: string,
  vscodePath: string,
  commit: string,
  connectionId: number,
  isFirstConnection: boolean,
  canUseIdleCallback: boolean,
  attachedToPageTimeout: number,
  inspectSharedProcess: boolean,
  inspectExtensions: boolean,
  inspectPtyHost: boolean,
  enableExtensions: boolean,
): Promise<PrepareBothResult> => {
  const initializationWorkerRpc = await launchInitializationWorker()
  const { webSocketUrl, devtoolsWebSocketUrl, electronObjectId, parsedVersion, utilityContext, sessionId, targetId } =
    await initializationWorkerRpc.invoke(
      'Launch.launch',
      headlessMode,
      cwd,
      ide,
      vscodePath,
      commit,
      connectionId,
      isFirstConnection,
      canUseIdleCallback,
      attachedToPageTimeout,
      inspectSharedProcess,
      inspectExtensions,
      inspectPtyHost,
      enableExtensions,
    )
  return {
    initializationWorkerRpc,
    webSocketUrl,
    devtoolsWebSocketUrl,
    electronObjectId,
    parsedVersion,
    utilityContext,
    sessionId,
    targetId,
  }
}
