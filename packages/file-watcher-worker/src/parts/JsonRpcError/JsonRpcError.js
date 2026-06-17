export class JsonRpcError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message)
    this.name = 'JsonRpcError'
  }
}
