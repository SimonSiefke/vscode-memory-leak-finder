import { join } from 'path'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.ts'
import * as Root from '../Root/Root.ts'

/**
 * @param {any} session
 * @returns {Promise<any>}
 */
export const getNamedClosureCount = async (session, objectGroup, id) => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `closure-count-${id}.json`)
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  await HeapSnapshotFunctions.loadHeapSnapshot(outFile)
  const counts = await HeapSnapshotFunctions.getNamedClosureCountFromHeapSnapshot(outFile)
  await HeapSnapshotFunctions.disposeHeapSnapshot(outFile)
  return counts
}
