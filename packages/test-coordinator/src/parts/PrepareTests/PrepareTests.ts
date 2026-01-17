import * as CanUseIdleCallback from '../CanUseIdleCallback/CanUseIdleCallback.ts'
import * as KillExistingIdeInstances from '../KillExistingIdeInstances/KillExistingIdeInstances.ts'
import { prepareBoth } from '../PrepareBoth/PrepareBoth.ts'

export interface PrepareTestsOptions {
  readonly arch: string
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
  readonly platform: string
  readonly recordVideo: boolean
  readonly runMode: number
  readonly timeouts: any
  readonly trackFunctions: boolean
  readonly updateUrl: string
  readonly useProxyMock: boolean
  readonly vscodePath: string
  readonly vscodeVersion: string
}

export const prepareTests = async (options: PrepareTestsOptions) => {
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
  const isFirstConnection = true
  const canUseIdleCallback = CanUseIdleCallback.canUseIdleCallback(headlessMode)
  await KillExistingIdeInstances.killExisingIdeInstances(ide)
  const {
    devtoolsWebSocketUrl,
    electronObjectId,
    functionTrackerRpc,
    initializationWorkerRpc,
    parsedVersion,
    pid,
    utilityContext,
    webSocketUrl,
  } = await prepareBoth({
    arch,
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
    measureId,
    platform,
    trackFunctions,
    updateUrl,
    useProxyMock,
    vscodePath,
    vscodeVersion,
  })

  return {
    devtoolsWebSocketUrl,
    electronObjectId,
    functionTrackerRpc,
    initializationWorkerRpc,
    parsedVersion,
    pid,
    utilityContext,
    webSocketUrl,
  }
}
