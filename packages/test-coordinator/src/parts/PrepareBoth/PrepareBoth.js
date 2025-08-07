import { launchInitializationWorker } from '../LaunchInitializationWorker/LaunchInitializationWorker.js'

export const prepareBoth = async (headlessMode, cwd, ide, vscodePath, commit, connectionId, isFirstConnection, canUseIdleCallback) => {
  const rpc = await launchInitializationWorker()
  const { webSocketUrl, devtoolsWebSocketUrl, monkeyPatchedElectronId, electronObjectId } = await rpc.invoke(
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
  }
}
