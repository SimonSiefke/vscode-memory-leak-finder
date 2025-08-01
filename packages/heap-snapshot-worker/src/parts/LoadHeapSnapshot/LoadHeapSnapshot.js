import { readFile } from 'node:fs/promises'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.js'

const makeMemoryEfficient = (heapSnapshot) => {
  const { snapshot, nodes, edges, strings, locations } = heapSnapshot
  return {
    snapshot,
    nodes: new Uint32Array(nodes),
    edges: new Uint32Array(edges),
    strings,
    locations: new Uint32Array(locations),
  }
}

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
