import * as HeapSnapshotWorker from '../HeapSnapshotWorker/HeapSnapshotWorker.js'

// TODO move these functions to heapsnapshot worker,
// process the whole heapsnapshot in worker
// to reduce memory usage in memory leak worker

export const getObjectShapeCountFromHeapSnapshot = async (value) => {
  // return GetObjectShapeCountFromHeapSnapshot.getObjectShapeCountFromHeapSnapshot(value)
  return 0
}

export const parseHeapSnapshotStrings = async (id) => {
  return HeapSnapshotWorker.invoke('HeapSnapshot.parseStrings', id)
}

export const parseHeapSnapshotFunctions = async (id, scriptMap) => {
  return HeapSnapshotWorker.invoke('HeapSnapshot.parseFunctions', id, scriptMap)
}

export const loadHeapSnapshot = async (path) => {
  return HeapSnapshotWorker.invoke('HeapSnapshot.load', path)
}

export const disposeHeapSnapshot = async (id) => {
  return HeapSnapshotWorker.invoke('HeapSnapshot.dispose', id)
}

export const parseHeapSnapshotNumbers = async (id) => {
  return HeapSnapshotWorker.invoke('HeapSnapshot.parseNumbers', id)
}

export const parseHeapSnapshotUserStrings = async (id) => {
  return HeapSnapshotWorker.invoke('HeapSnapshot.parseUserStrings', id)
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
