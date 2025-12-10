import * as CanUseIdleCallback from '../CanUseIdleCallback/CanUseIdleCallback.ts'
import * as KillExistingIdeInstances from '../KillExistingIdeInstances/KillExistingIdeInstances.ts'
import { prepareBoth } from '../PrepareBoth/PrepareBoth.ts'

export const prepareTests = async (
  cwd: string,
  headlessMode: boolean,
  recordVideo: boolean,
  connectionId: number,
  timeouts: any,
  ide: string,
  ideVersion: string,
  vscodePath: string,
  vscodeVersion: string,
  commit: string,
  attachedToPageTimeout: number,
  measureId: string,
  idleTimeout: number,
  pageObjectPath: string,
  runMode: number,
  inspectSharedProcess: boolean,
  inspectExtensions: boolean,
  inspectPtyHost: boolean,
  enableExtensions: boolean,
  inspectPtyHostPort: number,
  inspectSharedProcessPort: number,
  inspectExtensionsPort: number,
  enableProxy: boolean,
  useProxyMock: boolean,
) => {
  const isFirstConnection = true
  const canUseIdleCallback = CanUseIdleCallback.canUseIdleCallback(headlessMode)
  await KillExistingIdeInstances.killExisingIdeInstances(ide)
  const { webSocketUrl, devtoolsWebSocketUrl, electronObjectId, parsedVersion, utilityContext, initializationWorkerRpc } =
    await prepareBoth(
      headlessMode,
      cwd,
      ide,
      vscodePath,
      vscodeVersion,
      commit,
      connectionId,
      isFirstConnection,
      canUseIdleCallback,
      attachedToPageTimeout,
      inspectSharedProcess,
      inspectExtensions,
      inspectPtyHost,
      enableExtensions,
      inspectPtyHostPort,
      inspectSharedProcessPort,
      inspectExtensionsPort,
      enableProxy,
      useProxyMock,
    )

  return {
    parsedVersion,
    utilityContext,
    webSocketUrl,
    devtoolsWebSocketUrl,
    electronObjectId,
    initializationWorkerRpc,
  }
}
