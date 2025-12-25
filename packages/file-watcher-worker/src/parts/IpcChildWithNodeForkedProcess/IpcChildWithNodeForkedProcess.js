import { IpcError } from '../IpcError/IpcError.js'

export const create = () => {
  if (!process.send) {
    throw new IpcError('process.send is not available')
  }
  return process
}

/**
 * @param {NodeJS.Process} process
 */
export const wrap = (process) => {
  return {
    /**
     * @param {unknown} message
     */
    send(message) {
      if (!process.send) {
        throw new IpcError('process.send is not available')
      }
      process.send(message)
    },
    /**
     * @param {string} event
     * @param {(message: unknown) => void} listener
     */
    on(event, listener) {
      switch (event) {
        case 'message':
          // @ts-ignore - process.on exists for NodeJS.Process
          process.on('message', listener)
          break
        default:
          throw new Error('unknown event listener type')
      }
    },
    dispose() {
      process.removeAllListeners('message')
    },
  }
}
