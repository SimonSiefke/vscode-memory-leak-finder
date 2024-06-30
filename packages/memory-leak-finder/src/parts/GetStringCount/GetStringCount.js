import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.js'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.js'
import * as Root from '../Root/Root.js'
/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getStringCount = async (session, objectGroup) => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `1.json`)
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  const content = await readFile(outFile, 'utf8')
  const value = JSON.parse(content)
  const strings = await HeapSnapshotFunctions.parseHeapSnapshotStrings(value)
  const stringCount = strings.length
  return stringCount
}
