export class ExpectError extends Error {
  constructor(message: any) {
    super(message)
    this.name = 'ExpectError'
  }
}
