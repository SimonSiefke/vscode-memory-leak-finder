import { join } from 'path'
import * as HeapSnapshot from '../HeapSnapshot/Heapsnapshot.js'
import * as Root from '../Root/Root.js'
/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getStringCount = async (session, objectGroup) => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `1.json`)
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  return 0
}
