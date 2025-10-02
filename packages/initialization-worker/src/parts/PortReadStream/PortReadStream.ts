import { Readable } from 'node:stream'
import { MessagePort } from 'node:worker_threads'

export class PortReadStream extends Readable {
  port: MessagePort

  constructor(port: MessagePort) {
    super({ objectMode: true })
    this.port = port
    this.port.start()
    this.port.on('message', (event) => {
      console.log('got event')
      console.log(event)
    })
  }

  _read(size: number): void {}

  handleMessage(event) {
    this.push(event.data)
  }
}
