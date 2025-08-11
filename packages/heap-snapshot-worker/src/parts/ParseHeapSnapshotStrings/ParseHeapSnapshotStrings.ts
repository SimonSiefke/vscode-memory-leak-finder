import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.js'

export const parseHeapSnapshotStrings = (id) => {
  const heapsnapshot = HeapSnapshotState.get(id)

  const { strings } = heapsnapshot
  if (!Array.isArray(strings)) {
    throw new Error('no strings found')
  }
  return strings
}
