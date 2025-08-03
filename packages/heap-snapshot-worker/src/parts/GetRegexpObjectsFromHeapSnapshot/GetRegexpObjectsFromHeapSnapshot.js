import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'
import { readFile } from 'node:fs/promises'

const ITEMS_PER_NODE = 7

/**
 * @param {string} pathUri
 * @returns {Promise<Array>}
 */
export const getRegexpObjectsFromHeapSnapshot = async (pathUri) => {
  // Read and parse the heap snapshot file
  const content = await readFile(pathUri, 'utf8')
  const heapSnapshot = JSON.parse(content)
  const strings = heapSnapshot.strings || []

  // Use the proper parsing function to get parsed nodes and graph
  const { snapshot, nodes, edges, locations } = heapSnapshot
  const { meta } = snapshot
  const { node_types, node_fields, edge_types, edge_fields, location_fields } = meta
  
  // Import the proper parser
  const ParseHeapSnapshotInternal = await import('../ParseHeapSnapshotInternal/ParseHeapSnapshotInternal.js')
  const { parsedNodes, graph } = ParseHeapSnapshotInternal.parseHeapSnapshotInternal(
    nodes,
    node_fields,
    node_types[0],
    edges,
    edge_fields,
    edge_types[0],
    strings,
    locations,
    location_fields,
  )

  // Filter for regexp objects
  const regexpObjects = parsedNodes
    .filter(node => node.type === 'regexp')
    .map(node => {
      // Try to find the actual regex pattern
      let actualPattern = node.name || '<dummy>'
      
      // Look through edges for 'source' property
      const nodeEdges = graph[node.id] || []
      for (const edge of nodeEdges) {
        if (edge.name === 'source') {
          // Find the target node
          const targetNode = parsedNodes.find(n => n.id === edge.index)
          if (targetNode && targetNode.name && targetNode.name !== '<dummy>') {
            actualPattern = targetNode.name
            break
          }
        }
      }
      
      return {
        id: node.id,
        name: actualPattern,
        pattern: actualPattern,
        selfSize: node.self_size || node.selfSize,
        edgeCount: node.edge_count || node.edgeCount,
        traceNodeId: node.trace_node_id || node.traceNodeId,
        detachedness: node.detachedness,
      }
    })

  return regexpObjects
}
