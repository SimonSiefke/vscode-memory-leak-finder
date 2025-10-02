import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { pipeline } from 'node:stream/promises'
import * as Disposables from '../Disposables/Disposables.ts'
import { getInitializationWorkerUrl } from '../GetInitializationWorkerUrl/GetInitializationWorkerUrl.ts'
import * as LaunchIde from '../LaunchIde/LaunchIde.ts'
import { PortStream } from '../PortStream/PortStream.ts'

const createPipeline = (stream) => {
  const { port1, port2 } = new MessageChannel()

  const controller = new AbortController()
  // @ts-ignore
  const pipelinePromise = pipeline(stream, new PortStream(port2), {
    signal: controller.signal,
  })

  return {
    async dispose() {
      port2.close()
      await Promise.allSettled([pipelinePromise, controller.abort()])
    },
    port: port1,
  }
}

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
