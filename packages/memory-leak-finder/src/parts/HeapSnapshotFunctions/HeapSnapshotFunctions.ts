// TODO move these functions to heapsnapshot worker,
// process the whole heapsnapshot in worker
// to reduce memory usage in memory leak worker

export const getObjectShapeCountFromHeapSnapshot = async (rpc: any, value) => {
  // return GetObjectShapeCountFromHeapSnapshot.getObjectShapeCountFromHeapSnapshot(value)
  return 0
}

export const parseHeapSnapshotStrings = async (rpc: any, id) => {
  return rpc.invoke('HeapSnapshot.parseStrings', id)
}

export const compareStrings2 = async (rpc: any, pathA: string, pathB: string, minCount: number, includeChromeInternalStrings: boolean) => {
  return rpc.invoke('HeapSnapshot.compareStrings2', pathA, pathB, minCount, includeChromeInternalStrings)
}

export const getStringCount = async (rpc: any, id) => {
  return rpc.invoke('HeapSnapshot.parseStringCount', id)
}

export const parseHeapSnapshotFunctions = async (rpc: any, id, scriptMap, minCount) => {
  return rpc.invoke('HeapSnapshot.parseFunctions', id, scriptMap, minCount)
}

export const loadHeapSnapshot = async (rpc: any, path: string) => {
  return rpc.invoke('HeapSnapshot.load', path)
}

export const disposeHeapSnapshot = async (rpc: any, id) => {
  return rpc.invoke('HeapSnapshot.dispose', id)
}

export const parseHeapSnapshotNumbers = async (rpc: any, id) => {
  return rpc.invoke('HeapSnapshot.parseNumbers', id)
}

export const parseHeapSnapshotUserStrings = async (rpc: any, id) => {
  return rpc.invoke('HeapSnapshot.parseUserStrings', id)
}

export const getNamedArrayCountFromHeapSnapshot = async (rpc: any, value) => {
  return rpc.invoke('HeapSnapshot.parseNamedArrayCount', value)
}

export const getNamedEmitterCountFromHeapSnapshot = async (rpc: any, value) => {
  return rpc.invoke('HeapSnapshot.parseNamedEmitterCount', value)
}

export const getDomTimerCountFromHeapSnapshot = async (rpc: any, value) => {
  return rpc.invoke('HeapSnapshot.parseDomTimerCount', value)
}

export const getNamedClosureCountFromHeapSnapshot = async (rpc: any, value) => {
  return rpc.invoke('HeapSnapshot.parseNamedClosureCount', value)
}

export const getLargestArraysFromHeapSnapshot = async (rpc: any, value) => {
  return rpc.invoke('HeapSnapshot.getLargestArraysFromHeapSnapshot', value)
}

export const compareHeapSnapshotFunctions = async (rpc: any, pathA, pathB, useParallel = true) => {
  return rpc.invoke('HeapSnapshot.compareFunctions', pathA, pathB, useParallel)
}
