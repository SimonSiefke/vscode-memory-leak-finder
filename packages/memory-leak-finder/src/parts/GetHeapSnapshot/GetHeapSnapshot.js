import { join } from 'node:path'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.js'
import * as Root from '../Root/Root.js'

/**
 * @param {any} session
 * @returns {Promise<string>}
 */
export const getHeapSnapshot = async (session, id) => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `${id}.json`)
  console.info('taking heapsnapshot')
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  return outFile
}
