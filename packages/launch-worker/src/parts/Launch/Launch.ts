import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { pipeline } from 'node:stream/promises'
import * as Disposables from '../Disposables/Disposables.ts'
import { getInitializationWorkerUrl } from '../GetInitializationWorkerUrl/GetInitializationWorkerUrl.ts'
import * as LaunchIde from '../LaunchIde/LaunchIde.ts'
import { PortStream } from '../PortStream/PortStream.ts'
import { createPipeline } from '../CreatePipeline/CreatePipeline.ts'

export const launch = async (
  headlessMode: boolean,
  cwd: string,
  ide: string,
  vscodePath: string,
  commit: string,
  connectionId: number,
  isFirstConnection: boolean,
  canUseIdleCallback: boolean,
  attachedToPageTimeout: number,
  inspectSharedProcess: boolean,
  inspectExtensions: boolean,
  inspectPtyHost: boolean,
): Promise<any> => {
  const { child } = await LaunchIde.launchIde({
    headlessMode,
    cwd,
    ide,
    vscodePath,
    commit,
    addDisposable: Disposables.add,
    inspectSharedProcess,
    inspectExtensions,
    inspectPtyHost,
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
