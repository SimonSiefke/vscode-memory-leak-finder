import { launchInitializationWorker } from '../LaunchInitializationWorker/LaunchInitializationWorker.ts'

export const prepareBoth = async (headlessMode, cwd, ide, vscodePath, commit, connectionId, isFirstConnection, canUseIdleCallback) => {
  const initializationWorkerRpc = await launchInitializationWorker()
  const { webSocketUrl, devtoolsWebSocketUrl, monkeyPatchedElectronId, electronObjectId, parsedVersion } =
    await initializationWorkerRpc.invoke(
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
    parsedVersion,
  }
}
