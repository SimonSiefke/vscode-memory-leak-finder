import { join } from 'node:path'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.js'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.js'
import * as Root from '../Root/Root.js'

/**
 * @param {any} session
 * @returns {Promise<any>}
 */
export const getNamedEmitterCount = async (session, objectGroup) => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `emitter-count.json`)
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  await HeapSnapshotFunctions.loadHeapSnapshot(outFile)
  const counts = await HeapSnapshotFunctions.getNamedEmitterCountFromHeapSnapshot(outFile)
  await HeapSnapshotFunctions.disposeHeapSnapshot(outFile)
  return counts
}
