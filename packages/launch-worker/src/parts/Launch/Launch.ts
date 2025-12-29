import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { createPipeline } from '../CreatePipeline/CreatePipeline.ts'
import * as Disposables from '../Disposables/Disposables.ts'
import { getInitializationWorkerUrl } from '../GetInitializationWorkerUrl/GetInitializationWorkerUrl.ts'
import * as LaunchIde from '../LaunchIde/LaunchIde.ts'

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
  readonly platform: string
  readonly updateUrl: string
  readonly useProxyMock: boolean
  readonly vscodePath: string
  readonly vscodeVersion: string
}

const launchInitializationWorker = async () => {
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    path: getInitializationWorkerUrl(),
    stdio: 'inherit',
  })
  return {
    invoke(method: string, ...params: unknown[]) {
      return rpc.invoke(method, ...params)
    },
    invokeAndTransfer(method: string, ...params: unknown[]) {
      return rpc.invokeAndTransfer(method, ...params)
    },
    async [Symbol.asyncDispose]() {
      await rpc.dispose()
    },
  }
}

export const launch = async (options: LaunchOptions): Promise<any> => {
  const {
    arch,
    attachedToPageTimeout,
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
  } = options
  const { child, parsedVersion } = await LaunchIde.launchIde({
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
  await using port = createPipeline(child.stderr)
  await using rpc = await launchInitializationWorker()
  const { devtoolsWebSocketUrl, electronObjectId, utilityContext, webSocketUrl } = await rpc.invokeAndTransfer(
    'Initialize.prepare',
    headlessMode,
    attachedToPageTimeout,
    port.port,
    parsedVersion,
  )
  return {
    devtoolsWebSocketUrl,
    electronObjectId,
    parsedVersion,
    utilityContext,
    webSocketUrl,
  }
}
