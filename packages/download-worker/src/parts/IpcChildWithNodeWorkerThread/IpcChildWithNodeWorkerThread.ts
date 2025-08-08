import { parentPort } from 'node:worker_threads'
import { IpcError } from '../IpcError/IpcError.js'

export const create = (): any => {
  if (!parentPort) {
    throw new IpcError('parentPort is required')
  }
  parentPort.postMessage('ready')
  return parentPort
}

export const wrap = (parentPort: any): any => {
  return {
    send(message: any): void {
      parentPort.postMessage(message)
    },
    on(event: string, listener: any): void {
      switch (event) {
        case 'message':
          parentPort.on('message', listener)
          break
        default:
          throw new Error('unknown event listener type')
      }
    },
    dispose(): void {
      parentPort.removeAllListeners('message')
    },
  }
}
