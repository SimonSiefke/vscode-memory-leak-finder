import * as CanUseIdleCallback from '../CanUseIdleCallback/CanUseIdleCallback.ts'
import * as KillExistingIdeInstances from '../KillExistingIdeInstances/KillExistingIdeInstances.ts'
import { prepareBoth } from '../PrepareBoth/PrepareBoth.ts'

export interface PrepareTestsOptions {
  readonly attachedToPageTimeout: number
  readonly clearExtensions: boolean
  readonly commit: string
  readonly connectionId: number
  readonly cwd: string
  readonly enableExtensions: boolean
  readonly enableProxy: boolean
  readonly headlessMode: boolean
  readonly ide: string
  readonly ideVersion: string
  readonly idleTimeout: number
  readonly insidersCommit: string
  readonly inspectExtensions: boolean
  readonly inspectExtensionsPort: number
  readonly inspectPtyHost: boolean
  readonly inspectPtyHostPort: number
  readonly inspectSharedProcess: boolean
  readonly inspectSharedProcessPort: number
  readonly measureId: string
  readonly pageObjectPath: string
  readonly recordVideo: boolean
  readonly runMode: number
  readonly timeouts: any
  readonly useProxyMock: boolean
  readonly updateUrl: string
  readonly vscodePath: string
  readonly vscodeVersion: string
}

export const prepareTests = async (options: PrepareTestsOptions) => {
  const {
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
    useProxyMock,
    updateUrl,
    vscodePath,
    vscodeVersion,
  } = options
  const isFirstConnection = true
  const canUseIdleCallback = CanUseIdleCallback.canUseIdleCallback(headlessMode)
  await KillExistingIdeInstances.killExisingIdeInstances(ide)
  const { devtoolsWebSocketUrl, electronObjectId, initializationWorkerRpc, parsedVersion, utilityContext, webSocketUrl } =
    await prepareBoth({
      attachedToPageTimeout,
      canUseIdleCallback,
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
      isFirstConnection,
      useProxyMock,
      updateUrl,
      vscodePath,
      vscodeVersion,
    })

  return {
    devtoolsWebSocketUrl,
    electronObjectId,
    initializationWorkerRpc,
    parsedVersion,
    utilityContext,
    webSocketUrl,
  }
}
