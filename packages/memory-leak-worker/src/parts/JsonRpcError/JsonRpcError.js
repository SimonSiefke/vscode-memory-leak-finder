export class JsonRpcError extends Error {
  constructor(message) {
    super(message)
    this.name = 'JsonRpcError'
  }
}
