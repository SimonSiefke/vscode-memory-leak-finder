import { launchInitializationWorker } from '../LaunchInitializationWorker/LaunchInitializationWorker.js'

export const prepareBoth = async (headlessMode, cwd, ide, vscodePath, commit, connectionId, isFirstConnection, canUseIdleCallback) => {
  const initializationWorkerRpc = await launchInitializationWorker()
  const { webSocketUrl, devtoolsWebSocketUrl, monkeyPatchedElectronId, electronObjectId } = await initializationWorkerRpc.invoke(
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
    monkeyPatchedElectronId,
    electronObjectId,
    initializationWorkerRpc,
  }
}
