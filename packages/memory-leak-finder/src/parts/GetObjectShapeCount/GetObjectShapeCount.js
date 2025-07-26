import { join } from 'node:path'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.js'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.js'
import * as Root from '../Root/Root.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getObjectShapeCount = async (session, objectGroup) => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `object-shape.json`)
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  await HeapSnapshotFunctions.loadHeapSnapshot(outFile)
  const count = await HeapSnapshotFunctions.getObjectShapeCountFromHeapSnapshot(outFile)
  await HeapSnapshotFunctions.disposeHeapSnapshot(outFile)
  return count
}
