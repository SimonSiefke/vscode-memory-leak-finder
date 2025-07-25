import { readFile } from 'node:fs/promises'
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
  const content = await readFile(outFile, 'utf8')
  console.info('parsing heapsnapshot')
  const value = JSON.parse(content)
  console.info('analysing heapsnapshot')
  const functions = await HeapSnapshotFunctions.parseHeapSnapshotFunctions(value, scriptMap)
  return functions
}
