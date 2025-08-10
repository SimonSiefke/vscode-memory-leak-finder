export class IpcError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IpcError'
  }
}
