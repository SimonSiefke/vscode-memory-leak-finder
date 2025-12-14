import * as CanUseIdleCallback from '../CanUseIdleCallback/CanUseIdleCallback.ts'
import * as KillExistingIdeInstances from '../KillExistingIdeInstances/KillExistingIdeInstances.ts'
import { prepareBoth } from '../PrepareBoth/PrepareBoth.ts'

export interface PrepareTestsOptions {
  readonly cwd: string
  readonly headlessMode: boolean
  readonly recordVideo: boolean
  readonly connectionId: number
  readonly timeouts: any
  readonly ide: string
  readonly ideVersion: string
  readonly vscodePath: string
  readonly vscodeVersion: string
  readonly commit: string
  readonly insidersCommit: string
  readonly attachedToPageTimeout: number
  readonly measureId: string
  readonly idleTimeout: number
  readonly pageObjectPath: string
  readonly runMode: number
  readonly inspectSharedProcess: boolean
  readonly inspectExtensions: boolean
  readonly inspectPtyHost: boolean
  readonly enableExtensions: boolean
  readonly inspectPtyHostPort: number
  readonly inspectSharedProcessPort: number
  readonly inspectExtensionsPort: number
  readonly enableProxy: boolean
  readonly useProxyMock: boolean
}

export const prepareTests = async (options: PrepareTestsOptions) => {
  const {
    cwd,
    headlessMode,
    recordVideo,
    connectionId,
    timeouts,
    ide,
    ideVersion,
    vscodePath,
    vscodeVersion,
    commit,
    insidersCommit,
    attachedToPageTimeout,
    measureId,
    idleTimeout,
    pageObjectPath,
    runMode,
    inspectSharedProcess,
    inspectExtensions,
    inspectPtyHost,
    enableExtensions,
    inspectPtyHostPort,
    inspectSharedProcessPort,
    inspectExtensionsPort,
    enableProxy,
    useProxyMock,
  } = options
  const isFirstConnection = true
  const canUseIdleCallback = CanUseIdleCallback.canUseIdleCallback(headlessMode)
  await KillExistingIdeInstances.killExisingIdeInstances(ide)
  const { webSocketUrl, devtoolsWebSocketUrl, electronObjectId, parsedVersion, utilityContext, initializationWorkerRpc } =
    await prepareBoth({
      headlessMode,
      cwd,
      ide,
      vscodePath,
      vscodeVersion,
      commit,
      insidersCommit,
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
    })

  return {
    parsedVersion,
    utilityContext,
    webSocketUrl,
    devtoolsWebSocketUrl,
    electronObjectId,
    initializationWorkerRpc,
  }
}
