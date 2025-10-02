import { pipeline } from 'node:stream/promises'
import { MessagePort } from 'node:worker_threads'
import * as Disposables from '../Disposables/Disposables.ts'
import * as LaunchIde from '../LaunchIde/LaunchIde.ts'
import { PortStream } from '../PortStream/PortStream.ts'

export const launch = async (
  headlessMode: boolean,
  cwd: string,
  ide: string,
  vscodePath: string,
  commit: string,
  inspectSharedProcess: boolean,
  inspectExtensions: boolean,
  inspectPtyHost: boolean,
  port: MessagePort,
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
  await pipeline(child.stderr, new PortStream(port))
}
