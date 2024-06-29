import * as GetObjectShapeCountFromHeapSnapshot from '../GetObjectShapeCountFromHeapSnapshot/GetObjectShapeCountFromHeapSnapshot.js'
import * as ParseHeapSnapshotStrings from '../ParseHeapSnapshotStrings/ParseHeapSnapshotStrings.js'
import * as GetNamedArrayCountFromHeapSnapshot from '../GetNamedArrayCountFromHeapSnapshot/GetNamedArrayCountFromHeapSnapshot.js'

// TODO move these functions to heapsnapshot worker,
// process the whole heapsnapshot in worker
// to reduce memory usage in memory leak worker

export const getObjectShapeCountFromHeapSnapshot = async (value) => {
  return GetObjectShapeCountFromHeapSnapshot.getObjectShapeCountFromHeapSnapshot(value)
}

export const parseHeapSnapshotStrings = async (value) => {
  return ParseHeapSnapshotStrings.parseHeapSnapshotStrings(value)
}

export const getNamedArrayCountFromHeapSnapshot = async (value) => {
  return GetNamedArrayCountFromHeapSnapshot.getNamedArrayCountFromHeapSnapshot(value)
}
