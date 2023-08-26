export class NotImplementedError extends Error {
  constructor(message) {
    super('not implemented')
    this.name = 'NotImplementedError'
  }
}
