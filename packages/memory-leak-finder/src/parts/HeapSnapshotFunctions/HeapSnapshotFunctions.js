import * as HeapSnapshotWorker from '../HeapSnapshotWorker/HeapSnapshotWorker.js'

// TODO move these functions to heapsnapshot worker,
// process the whole heapsnapshot in worker
// to reduce memory usage in memory leak worker

export const getObjectShapeCountFromHeapSnapshot = async (value) => {
  // return GetObjectShapeCountFromHeapSnapshot.getObjectShapeCountFromHeapSnapshot(value)
  return 0
}

export const parseHeapSnapshotStrings = async (value) => {
  return HeapSnapshotWorker.invoke('HeapSnapshot.parseStrings', value)
}

export const getNamedArrayCountFromHeapSnapshot = async (value) => {
  return HeapSnapshotWorker.invoke('HeapSnapshot.parseNamedArrayCount', value)
}
