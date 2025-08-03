import { IpcError } from '../IpcError/IpcError.js'

export const create = () => {
  if (!process.send) {
    throw new IpcError('process.send is not available')
  }
  return process
}

export const wrap = (process: any): any => {
  return {
    send(message: any): void {
      process.send(message)
    },
    on(event: string, listener: any): void {
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
