import { readFile } from 'node:fs/promises'

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
 * @returns {Promise<any>}
 */
export const loadHeapSnapshot = async (path) => {
  const content = await readFile(path, 'utf8')
  const value = JSON.parse(content)
  const efficient = makeMemoryEfficient(value)
  return efficient
}
