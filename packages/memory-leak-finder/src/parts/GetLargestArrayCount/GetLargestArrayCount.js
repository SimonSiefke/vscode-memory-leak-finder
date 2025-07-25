import { join } from 'path'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.js'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.js'
import { loadHeapSnapshot } from '../LoadHeapSnapshot/LoadHeapSnapshot.js'
import * as Root from '../Root/Root.js'

/**
 * @param {any} session
 * @returns {Promise<any>}
 */
export const getLargestArrayCount = async (session, objectGroup) => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `largest-array-count.json`)
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  const value = await loadHeapSnapshot(outFile)
  const arrays = await HeapSnapshotFunctions.getLargestArraysFromHeapSnapshot(value)
  return arrays
}
