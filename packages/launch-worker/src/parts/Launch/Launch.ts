import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { createPipeline } from '../CreatePipeline/CreatePipeline.ts'
import * as Disposables from '../Disposables/Disposables.ts'
import { getInitializationWorkerUrl } from '../GetInitializationWorkerUrl/GetInitializationWorkerUrl.ts'
import * as LaunchIde from '../LaunchIde/LaunchIde.ts'

export interface LaunchOptions {
  readonly headlessMode: boolean
  readonly cwd: string
  readonly ide: string
  readonly vscodePath: string
  readonly vscodeVersion: string
  readonly commit: string
  readonly insidersCommit: string
  readonly connectionId: number
  readonly isFirstConnection: boolean
  readonly canUseIdleCallback: boolean
  readonly attachedToPageTimeout: number
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

export const launch = async (options: LaunchOptions): Promise<any> => {
  const {
    headlessMode,
    cwd,
    ide,
    vscodePath,
    vscodeVersion,
    commit,
    insidersCommit,
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
  } = options
  const { child } = await LaunchIde.launchIde({
    headlessMode,
    cwd,
    ide,
    vscodePath,
    vscodeVersion,
    commit,
    insidersCommit,
    addDisposable: Disposables.add,
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
  const { port, dispose } = createPipeline(child.stderr)
  const rpc = await NodeWorkerRpcParent.create({
    path: getInitializationWorkerUrl(),
    commandMap: {},
    stdio: 'inherit',
  })
  const { devtoolsWebSocketUrl, electronObjectId, parsedVersion, utilityContext, webSocketUrl } = await rpc.invokeAndTransfer(
    'Initialize.prepare',
    headlessMode,
    attachedToPageTimeout,
    port,
  )
  await Promise.all([rpc.dispose(), dispose()])

  return {
    devtoolsWebSocketUrl,
    electronObjectId,
    parsedVersion,
    utilityContext,
    webSocketUrl,
  }
}
