import { readFile } from 'fs/promises'
import { join } from 'path'
import * as GetNamedArrayCountFromHeapSnapshot2 from '../GetNamedArrayCountFromHeapSnapshot2/GetNamedArrayCountFromHeapSnapshot2.js'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.js'
import * as Root from '../Root/Root.js'

/**
 * @param {any} session
 * @returns {Promise<any>}
 */
export const getNamedArrayCount = async (session, objectGroup) => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `array-count.json`)
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  const content = await readFile(outFile, 'utf8')
  const value = JSON.parse(content)
  const arrayCountMap = GetNamedArrayCountFromHeapSnapshot2.getNamedArrayCountFromHeapSnapshot(value)
  return arrayCountMap
}
