import { IpcError } from '../IpcError/IpcError.js'

export const create = () => {
  if (!process.send) {
    throw new IpcError('process.send is not available')
  }
  return process
}

export const wrap = (process) => {
  return {
    send(message) {
      process.send(message)
    },
    on(event, listener) {
      switch (event) {
        case 'message':
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
