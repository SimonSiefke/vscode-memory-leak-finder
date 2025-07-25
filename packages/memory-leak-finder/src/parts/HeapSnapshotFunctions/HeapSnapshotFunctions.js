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

export const parseHeapSnapshotFunctions = async (value, scriptMap) => {
  return HeapSnapshotWorker.invoke('HeapSnapshot.parseFunctions', value, scriptMap)
}

export const parseHeapSnapshotNumbers = async (value) => {
  return HeapSnapshotWorker.invoke('HeapSnapshot.parseNumbers', value)
}

export const parseHeapSnapshotUserStrings = async (value) => {
  return HeapSnapshotWorker.invoke('HeapSnapshot.parseUserStrings', value)
}

export const getNamedArrayCountFromHeapSnapshot = async (value) => {
  return HeapSnapshotWorker.invoke('HeapSnapshot.parseNamedArrayCount', value)
}

export const getNamedEmitterCountFromHeapSnapshot = async (value) => {
  return HeapSnapshotWorker.invoke('HeapSnapshot.parseNamedEmitterCount', value)
}

export const getNamedClosureCountFromHeapSnapshot = async (value) => {
  return HeapSnapshotWorker.invoke('HeapSnapshot.parseNamedClosureCount', value)
}

export const getLargestArraysFromHeapSnapshot = async (value) => {
  return HeapSnapshotWorker.invoke('HeapSnapshot.getLargestArraysFromHeapSnapshot', value)
}
