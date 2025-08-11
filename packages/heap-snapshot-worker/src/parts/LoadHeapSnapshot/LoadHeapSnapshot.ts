import { readFile } from 'node:fs/promises'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.ts'

/**
 * @param {string} path
 * @returns {Promise<void>}
 */
export const loadHeapSnapshot = async (path) => {
  const content = await readFile(path, 'utf8')
  const value = JSON.parse(content)
  const mergedStrings = value.strings.join('\n')
  value.merged = mergedStrings
  // const efficient = makeMemoryEfficient(value)
  HeapSnapshotState.set(path, value)
}
