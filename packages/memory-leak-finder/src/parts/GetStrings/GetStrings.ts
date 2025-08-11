import { join } from 'node:path'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.js'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.js'
import * as Root from '../Root/Root.js'
/**
 *
 * @param {any} session
 * @returns {Promise<string[]>}
 */
export const getStrings = async (session, objectGroup, id) => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `${id}.json`)
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  await HeapSnapshotFunctions.loadHeapSnapshot(outFile)
  const strings = await HeapSnapshotFunctions.parseHeapSnapshotStrings(outFile)
  await HeapSnapshotFunctions.disposeHeapSnapshot(outFile)
  return strings
}
