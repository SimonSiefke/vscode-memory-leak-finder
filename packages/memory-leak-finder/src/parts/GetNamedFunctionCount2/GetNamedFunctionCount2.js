import { join } from 'node:path'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.js'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.js'
import * as Root from '../Root/Root.js'

/**
 * @param {any} session
 * @returns {Promise<any[]>}
 */
export const getNamedFunctionCount2 = async (session, objectGroup, scriptMap, includeSourceMap) => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `1.json`)
  console.info('taking heapsnapshot')
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  console.info('parsing heapsnapshot')
  console.time('load')
  await HeapSnapshotFunctions.loadHeapSnapshot(outFile)
  console.timeEnd('load')
  const functions = await HeapSnapshotFunctions.parseHeapSnapshotFunctions(outFile, scriptMap)
  await HeapSnapshotFunctions.disposeHeapSnapshot(outFile)
  return functions
}
