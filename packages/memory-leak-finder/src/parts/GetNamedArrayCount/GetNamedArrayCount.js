import { join } from 'path'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.js'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.js'
import * as Root from '../Root/Root.js'

/**
 * @param {any} session
 * @returns {Promise<any>}
 */
export const getNamedArrayCount = async (session, objectGroup) => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `array-count.json`)
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  await HeapSnapshotFunctions.loadHeapSnapshot(outFile)
  const arrayCountMap = await HeapSnapshotFunctions.getNamedArrayCountFromHeapSnapshot(outFile)
  await HeapSnapshotFunctions.disposeHeapSnapshot(outFile)
  return arrayCountMap
}
