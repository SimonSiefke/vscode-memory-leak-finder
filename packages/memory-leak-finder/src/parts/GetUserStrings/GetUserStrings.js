import { join } from 'node:path'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.js'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.js'
import { loadHeapSnapshot } from '../LoadHeapSnapshot/LoadHeapSnapshot.js'
import * as Root from '../Root/Root.js'
/**
 *
 * @param {any} session
 * @returns {Promise<string[]>}
 */
export const getUserStrings = async (session, objectGroup) => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `1.json`)
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  const value = await loadHeapSnapshot(outFile)
  const strings = await HeapSnapshotFunctions.parseHeapSnapshotUserStrings(value)
  return strings
}
