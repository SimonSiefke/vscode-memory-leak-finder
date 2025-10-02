import { Writable } from 'node:stream'
import { MessagePort } from 'node:worker_threads'

export class PortStream extends Writable {
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
