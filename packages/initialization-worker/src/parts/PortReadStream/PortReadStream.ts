import { Readable } from 'node:stream'
import { MessagePort } from 'node:worker_threads'

export class PortReadStream extends Readable {
  port: MessagePort

  constructor(port: MessagePort) {
    super({ objectMode: true })
    this.port = port
    this.port.start()
    const decoder = new TextDecoder('utf-8')

    this.port.on('message', (message) => {
      const decoded = decoder.decode(message)
      this.handleMessage(decoded)
    })
  }

  _read(size: number): void {}

  handleMessage(message) {
    this.push(message)
  }
}
