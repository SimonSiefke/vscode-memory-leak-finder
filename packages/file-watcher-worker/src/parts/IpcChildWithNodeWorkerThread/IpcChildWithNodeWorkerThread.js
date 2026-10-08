import { parentPort } from 'node:worker_threads'
import { IpcError } from '../IpcError/IpcError.js'

export const create = () => {
  if (!parentPort) {
    throw new IpcError('parentPort is required')
  }
  parentPort.postMessage('ready')
  return parentPort
}

/**
 * @param {import('node:worker_threads').MessagePort} parentPort
 */
export const wrap = (parentPort) => {
  return {
    /**
     * @param {unknown} message
     */
    send(message) {
      parentPort.postMessage(message)
    },
    /**
     * @param {string} event
     * @param {(message: unknown) => void} listener
     */
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
