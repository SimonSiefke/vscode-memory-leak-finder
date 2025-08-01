import { join } from 'path'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.js'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.js'
import * as Root from '../Root/Root.js'

/**
 * @param {any} session
 * @returns {Promise<any>}
 */
export const getLargestArrayCount = async (session, objectGroup, id) => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `largest-array-count-${id}.json`)
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  await HeapSnapshotFunctions.loadHeapSnapshot(outFile)
  const arrays = await HeapSnapshotFunctions.getLargestArraysFromHeapSnapshot(outFile)
  await HeapSnapshotFunctions.disposeHeapSnapshot(outFile)
  return arrays
}
