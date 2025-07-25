import { join } from 'node:path'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.js'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.js'
import { loadHeapSnapshot } from '../LoadHeapSnapshot/LoadHeapSnapshot.js'
import * as Root from '../Root/Root.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getObjectShapeCount = async (session, objectGroup) => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `object-shape.json`)
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  const value = await loadHeapSnapshot(outFile)
  const count = await HeapSnapshotFunctions.getObjectShapeCountFromHeapSnapshot(value)
  return count
}
