export class HeapSnapshotParserError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HeapSnapshotParserError'
  }
}
