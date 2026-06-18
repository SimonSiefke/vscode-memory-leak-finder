import type { Dynamic } from '../Types/Types.ts'
// TODO move these functions to heapsnapshot worker,
// process the whole heapsnapshot in worker
// to reduce memory usage in memory leak worker
export const getObjectShapeCountFromHeapSnapshot = async (rpc: Dynamic, value: Dynamic) => {
  // return GetObjectShapeCountFromHeapSnapshot.getObjectShapeCountFromHeapSnapshot(value)
  return 0
}
export const parseHeapSnapshotStrings = async (rpc: Dynamic, id: Dynamic) => {
  return rpc.invoke('HeapSnapshot.parseStrings', id)
}
export const compareStrings2 = async (
  rpc: Dynamic,
  pathA: string,
  pathB: string,
  minCount: number,
  includeChromeInternalStrings: boolean,
) => {
  return rpc.invoke('HeapSnapshot.compareStrings2', pathA, pathB, minCount, includeChromeInternalStrings)
}
export const getStringCount = async (rpc: Dynamic, id: Dynamic) => {
  return rpc.invoke('HeapSnapshot.parseStringCount', id)
}
export const parseHeapSnapshotFunctions = async (rpc: Dynamic, id: Dynamic, scriptMap: Dynamic, minCount: Dynamic) => {
  return rpc.invoke('HeapSnapshot.parseFunctions', id, scriptMap, minCount)
}
export const loadHeapSnapshot = async (rpc: Dynamic, path: string) => {
  return rpc.invoke('HeapSnapshot.load', path)
}
export const disposeHeapSnapshot = async (rpc: Dynamic, id: Dynamic) => {
  return rpc.invoke('HeapSnapshot.dispose', id)
}
export const parseHeapSnapshotNumbers = async (rpc: Dynamic, id: Dynamic) => {
  return rpc.invoke('HeapSnapshot.parseNumbers', id)
}
export const parseHeapSnapshotUserStrings = async (rpc: Dynamic, id: Dynamic) => {
  return rpc.invoke('HeapSnapshot.parseUserStrings', id)
}
export const getNamedArrayCountFromHeapSnapshot = async (rpc: Dynamic, value: Dynamic) => {
  return rpc.invoke('HeapSnapshot.parseNamedArrayCount', value)
}
export const getNamedEmitterCountFromHeapSnapshot = async (rpc: Dynamic, value: Dynamic) => {
  return rpc.invoke('HeapSnapshot.parseNamedEmitterCount', value)
}
export const getDomTimerCountFromHeapSnapshot = async (rpc: Dynamic, value: Dynamic) => {
  return rpc.invoke('HeapSnapshot.parseDomTimerCount', value)
}
export const getNamedClosureCountFromHeapSnapshot = async (rpc: Dynamic, value: Dynamic) => {
  return rpc.invoke('HeapSnapshot.parseNamedClosureCount', value)
}
export const getLargestArraysFromHeapSnapshot = async (rpc: Dynamic, value: Dynamic) => {
  return rpc.invoke('HeapSnapshot.getLargestArraysFromHeapSnapshot', value)
}
export const compareHeapSnapshotFunctions = async (rpc: Dynamic, pathA: Dynamic, pathB: Dynamic, useParallel: Dynamic = true) => {
  return rpc.invoke('HeapSnapshot.compareFunctions', pathA, pathB, useParallel)
}
export const compareStringCounts = async (rpc: Dynamic, pathA: string, pathB: string) => {
  return rpc.invoke('HeapSnapshot.compareStringCount', pathA, pathB)
}
