export class HeapSnapshotParserError extends Error {
  constructor(message) {
    super(message)
    this.name = 'HeapSnapshotParserError'
  }
}
