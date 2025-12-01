export class IpcError extends Error {
  constructor(message) {
    super(message)
    this.name = 'IpcError'
  }
}
