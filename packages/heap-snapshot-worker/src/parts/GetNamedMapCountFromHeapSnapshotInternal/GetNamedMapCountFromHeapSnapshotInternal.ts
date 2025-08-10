import type { Snapshot } from '../Snapshot/Snapshot.js'

interface NamedMapResult {
  id: number
  name: string | string[]
  size: number
}

/**
 *
 * @param snapshot
 * @returns Array of named map results with id, name, and size
 */
export const getNamedMapCountFromHeapSnapshotInternal = (snapshot: Snapshot): NamedMapResult[] => {
  const { nodes, strings, edges, meta } = snapshot
  const { node_fields, edge_fields } = meta

  const ITEMS_PER_NODE = node_fields.length
  const ITEMS_PER_EDGE = edge_fields.length

  // Find the index of "Map" in the strings array
  const mapStringIndex = strings.indexOf('Map')
  if (mapStringIndex === -1) {
    return []
  }

  // Find all Map objects
  const mapNodes: Array<{ nodeIndex: number; id: number; edgeCount: number }> = []
  for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
    const nodeType = nodes[i]
    const nodeNameIndex = nodes[i + 1]
    const nodeId = nodes[i + 2]

    if (nodeType === 4 && nodeNameIndex === mapStringIndex) {
      // type 4 = object
      mapNodes.push({
        nodeIndex: i / ITEMS_PER_NODE,
        id: nodeId,
        edgeCount: nodes[i + 4],
      })
    }
  }

  // For each Map object, find its names and size
  const result: NamedMapResult[] = []

  for (const mapNode of mapNodes) {
    const names = new Set<string>()
    let size = 0

    // Find edges that point to this Map object
    for (let i = 0; i < edges.length; i += ITEMS_PER_EDGE) {
      const edgeNameOrIndex = edges[i + 1]
      const edgeToNode = edges[i + 2]

      if (edgeToNode === mapNode.nodeIndex) {
        // This edge points to our Map object
        if (edgeNameOrIndex < strings.length) {
          const name = strings[edgeNameOrIndex]
          if (name && name !== '') {
            names.add(name)
          }
        }
      }
    }

    // Find edges from this Map object to count its entries
    const mapNodeStart = mapNode.nodeIndex * ITEMS_PER_NODE
    const edgeCount = nodes[mapNodeStart + 4]

    // Count the number of key-value pairs by looking at edges from this Map
    let edgeIndex = 0
    for (let i = 0; i < edges.length; i += ITEMS_PER_EDGE) {
      const edgeFromNode = Math.floor(i / ITEMS_PER_EDGE)
      if (edgeFromNode === mapNode.nodeIndex) {
        edgeIndex++
        if (edgeIndex > edgeCount) break

        // Count element edges (key-value pairs)
        const edgeType = edges[i]
        if (edgeType === 1) {
          // element edge
          size++
        }
      }
    }

    // Convert names Set to array or string
    const nameArray = Array.from(names)
    const name = nameArray.length === 1 ? nameArray[0] : nameArray

    result.push({
      id: mapNode.id,
      name: name,
      size: size,
    })
  }

  return result
}
