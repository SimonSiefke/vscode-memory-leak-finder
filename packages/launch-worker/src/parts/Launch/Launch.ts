import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { pipeline } from 'node:stream/promises'
import * as Disposables from '../Disposables/Disposables.ts'
import { getInitializationWorkerUrl } from '../GetInitializationWorkerUrl/GetInitializationWorkerUrl.ts'
import * as LaunchIde from '../LaunchIde/LaunchIde.ts'
import { PortStream } from '../PortStream/PortStream.ts'

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
  const { port1, port2 } = new MessageChannel()
  const rpc = await NodeWorkerRpcParent.create({
    path: getInitializationWorkerUrl(),
    commandMap: {},
  })
  const promise = rpc.invoke('Initialize.prepare', headlessMode, attachedToPageTimeout, port1)
  const pipelinePromise = pipeline(child.stderr, new PortStream(port2))
  const { devtoolsWebSocketUrl, electronObjectId, parsedVersion, utilityContext, webSocketUrl } = await promise
  // TODO close pipeline stream
  return {
    devtoolsWebSocketUrl,
    electronObjectId,
    parsedVersion,
    utilityContext,
    webSocketUrl,
  }
}
