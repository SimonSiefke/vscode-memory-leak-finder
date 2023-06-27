import { parentPort } from 'node:worker_threads'
import { IpcError } from '../IpcError/IpcError.js'

export const create = () => {
  if (!parentPort) {
    throw new IpcError('parentPort is required')
  }
  parentPort.postMessage('ready')
  return parentPort
}

export const wrap = (parentPort) => {
  return {
    send(message) {
      parentPort.postMessage(message)
    },
    on(event, listener) {
      switch (event) {
        case 'message':
          parentPort.on('message', listener)
          break
        default:
          throw new Error('unknown event listener type')
      }
    },
    dispose() {
      parentPort.removeAllListeners('message')
    },
  }
}
