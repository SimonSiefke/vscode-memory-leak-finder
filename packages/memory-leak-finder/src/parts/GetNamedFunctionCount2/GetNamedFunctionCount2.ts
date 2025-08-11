import { join } from 'node:path'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.ts'
import * as Root from '../Root/Root.ts'

/**
 * @param {any} session
 * @returns {Promise<any[]>}
 */
export const getNamedFunctionCount2 = async (session, objectGroup, scriptMap, includeSourceMap, id) => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `${id}.json`)
  console.info('taking heapsnapshot')
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  console.info('parsing heapsnapshot')
  console.time('load')
  await HeapSnapshotFunctions.loadHeapSnapshot(outFile)
  console.timeEnd('load')
  const minCount = 1
  const functions = await HeapSnapshotFunctions.parseHeapSnapshotFunctions(outFile, scriptMap, minCount)
  await HeapSnapshotFunctions.disposeHeapSnapshot(outFile)
  return functions
}
