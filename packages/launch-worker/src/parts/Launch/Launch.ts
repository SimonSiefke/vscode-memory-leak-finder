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

  // console.log('stderr', child.stderr)
  const { port1, port2 } = new MessageChannel()

  // @ts-ignore
  const pipelinePromise = pipeline(child.stderr, new PortStream(port2))

  const rpc = await NodeWorkerRpcParent.create({
    path: getInitializationWorkerUrl(),
    commandMap: {},
    stdio: 'inherit',
  })
  const promise = rpc.invokeAndTransfer('Initialize.prepare', headlessMode, attachedToPageTimeout, port1)

  const { devtoolsWebSocketUrl, electronObjectId, parsedVersion, utilityContext, webSocketUrl } = await promise
  await rpc.dispose()
  // TODO close pipeline stream
  return {
    devtoolsWebSocketUrl,
    electronObjectId,
    parsedVersion,
    utilityContext,
    webSocketUrl,
  }
}
