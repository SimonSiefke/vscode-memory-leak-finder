import { launchInitializationWorker } from '../LaunchInitializationWorker/LaunchInitializationWorker.ts'

export interface PrepareBothResult {
  readonly webSocketUrl: string
  readonly devtoolsWebSocketUrl: string
  readonly electronObjectId: string
  readonly parsedVersion: string
}

export const prepareBoth = async (
  headlessMode: boolean,
  cwd: string,
  ide: string,
  vscodePath: string,
  commit: string,
  connectionId: string,
  isFirstConnection: boolean,
  canUseIdleCallback: boolean,
): Promise<PrepareBothResult> => {
  const initializationWorkerRpc = await launchInitializationWorker()
  const { webSocketUrl, devtoolsWebSocketUrl, electronObjectId, parsedVersion } = await initializationWorkerRpc.invoke(
    'Initialize.prepare',
    headlessMode,
    cwd,
    ide,
    vscodePath,
    commit,
    connectionId,
    isFirstConnection,
    canUseIdleCallback,
  )
  return {
    webSocketUrl,
    devtoolsWebSocketUrl,
    electronObjectId,
    parsedVersion,
  }
}
