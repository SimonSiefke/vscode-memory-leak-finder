export class TestFinishedError extends Error {
  constructor() {
    super('test already finished')
    this.name = 'TestFinishedError'
  }
}
