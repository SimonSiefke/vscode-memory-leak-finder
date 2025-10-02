import { MessagePort } from 'node:worker_threads'
import * as Disposables from '../Disposables/Disposables.ts'
import * as LaunchIde from '../LaunchIde/LaunchIde.ts'
import { pipeline } from 'node:stream/promises'
import { Readable, Writable } from 'node:stream'

class PortStream extends Writable {
  port: MessagePort
  constructor(port: MessagePort) {
    super()
    this.port = port
  }

  _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    this.port.postMessage(chunk)
    callback(null)
  }
}

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
  const { child, parsedVersion } = await LaunchIde.launchIde({
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
