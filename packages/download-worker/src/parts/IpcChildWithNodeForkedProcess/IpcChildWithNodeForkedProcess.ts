import { IpcError } from '../IpcError/IpcError.ts'

export const create = (): any => {
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
    dispose(): void {
      process.removeAllListeners('message')
    },
  }
}
