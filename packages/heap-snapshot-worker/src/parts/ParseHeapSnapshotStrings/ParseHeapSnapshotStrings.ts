import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.ts'

export const parseHeapSnapshotStrings = (id) => {
  const heapsnapshot = HeapSnapshotState.get(id)

  const { strings } = heapsnapshot
  if (!Array.isArray(strings)) {
    throw new TypeError('no strings found')
  }
  return strings
}
