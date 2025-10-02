import { pipeline } from 'node:stream/promises'
import { MessagePort } from 'node:worker_threads'
import * as Disposables from '../Disposables/Disposables.ts'
import * as LaunchIde from '../LaunchIde/LaunchIde.ts'
import { PortStream } from '../PortStream/PortStream.ts'
import { NodeWorkerRpcParent } from '@lvce-editor/rpc'

export const launch = async (
  headlessMode: boolean,
  cwd: string,
  ide: string,
  vscodePath: string,
  commit: string,
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
    path: getOriginalNameWorkerPath(),
    commandMap: {},
  })
  await pipeline(child.stderr, new PortStream(port1))
}
