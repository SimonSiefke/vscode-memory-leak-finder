import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { parseNode } from '../ParseNode/ParseNode.ts'
import { getNodeEdgesFast } from '../GetNodeEdgesFast/GetNodeEdgesFast.ts'
import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import { getNodeName } from '../GetNodeName/GetNodeName.ts'
import { getNodeTypeName } from '../GetNodeTypeName/GetNodeTypeName.ts'
import { getActualValue } from '../GetActualValue/GetActualValue.ts'

export interface NodeExaminationResult {
  nodeIndex: number
  nodeId: number
  node: any
  nodeName: string | null
  nodeType: string | null
  edges: Array<{
    type: number
    typeName: string
    nameIndex: number
    edgeName: string
    toNode: number
    targetNodeInfo?: {
      name: string | null
      type: string | null
    }
  }>
  properties: Array<{
    name: string
    value: string | null
    targetType: string | null
  }>
}

/**
 * Finds a node by its ID and returns detailed information about it
 * @param nodeId - The ID of the node to find and examine
 * @param snapshot - The heap snapshot data
 * @returns Detailed examination result of the node or null if not found
 */
export const examineNodeById = (nodeId: number, snapshot: Snapshot): NodeExaminationResult | null => {
  const { node_fields } = snapshot.meta
  const ITEMS_PER_NODE = node_fields.length
  const idFieldIndex = node_fields.indexOf('id')

  // Find the node with the given ID
  let nodeIndex = -1
  for (let i = 0; i < snapshot.nodes.length; i += ITEMS_PER_NODE) {
    if (snapshot.nodes[i + idFieldIndex] === nodeId) {
      nodeIndex = i / ITEMS_PER_NODE
      break
    }
  }

  if (nodeIndex === -1) {
    return null
  }

  return examineNodeByIndex(nodeIndex, snapshot)
}

/**
 * Examines a specific node by index and returns detailed information about it
 * @param nodeIndex - The index of the node to examine (0-based)
 * @param snapshot - The heap snapshot data
 * @returns Detailed examination result of the node
 */
export const examineNodeByIndex = (nodeIndex: number, snapshot: Snapshot): NodeExaminationResult | null => {
  const { nodes, edges, strings, meta } = snapshot
  const { node_fields, edge_fields, node_types, edge_types } = meta

  // Parse the target node
  const node = parseNode(nodeIndex, nodes, node_fields)
  if (!node) {
    return null
  }

  // Get node name and type
  const nodeName = getNodeName(node, strings)
  const nodeType = getNodeTypeName(node, node_types)

  // Create edge map for fast lookups
  const edgeMap = createEdgeMap(nodes, node_fields)

  // Get all edges for this node as a subarray
  const ITEMS_PER_NODE = node_fields.length
  const ITEMS_PER_EDGE = edge_fields.length
  const edgeCountFieldIndex = node_fields.indexOf('edge_count')
  const nodeEdges = getNodeEdgesFast(nodeIndex, edgeMap, nodes, edges, ITEMS_PER_NODE, ITEMS_PER_EDGE, edgeCountFieldIndex)

  // Process edges to get detailed information
  const edgeTypeNames = edge_types[0] || []
  const ITEMS_PER_EDGE = edge_fields.length
  const edgeTypeFieldIndex = edge_fields.indexOf('type')
  const edgeNameFieldIndex = edge_fields.indexOf('name_or_index')
  const edgeToNodeFieldIndex = edge_fields.indexOf('to_node')

  const processedEdges = [] as Array<{
    type: number
    typeName: string
    nameIndex: number
    edgeName: string
    toNode: number
    targetNodeInfo?: { name: string | null; type: string | null }
  }>
  for (let i = 0; i < nodeEdges.length; i += ITEMS_PER_EDGE) {
    const type = nodeEdges[i + edgeTypeFieldIndex]
    const nameIndex = nodeEdges[i + edgeNameFieldIndex]
    const toNode = nodeEdges[i + edgeToNodeFieldIndex]
    const typeName = edgeTypeNames[type] || `type_${type}`
    let edgeName = ''
    if (typeName === 'element') {
      edgeName = `[${nameIndex}]`
    } else {
      edgeName = strings[nameIndex] || `<string_${nameIndex}>`
    }
    const targetNodeIndex = Math.floor(toNode / node_fields.length)
    const targetNode = parseNode(targetNodeIndex, nodes, node_fields)
    const targetNodeInfo = targetNode
      ? {
          name: getNodeName(targetNode, strings),
          type: getNodeTypeName(targetNode, node_types),
        }
      : undefined
    processedEdges.push({ type, typeName, nameIndex, edgeName, toNode, targetNodeInfo })
  }

  // Extract properties (property-type edges) with improved value detection
  const properties = processedEdges
    .filter((edge) => edge.typeName === 'property')
    .map((edge) => {
      let actualValue = edge.targetNodeInfo?.name || null

      // Try to get the actual value using improved detection for booleans, undefined, etc.
      if (edge.targetNodeInfo) {
        const targetNodeIndex = Math.floor(edge.toNode / node_fields.length)
        const targetNode = parseNode(targetNodeIndex, nodes, node_fields)
        if (targetNode) {
          try {
            const detectedValue = getActualValue(targetNode, snapshot, edgeMap)
            // Use detected value if it's not null and different from basic name, or if it's an empty string
            if (detectedValue !== null && (detectedValue !== edge.targetNodeInfo.name || detectedValue === '')) {
              actualValue = detectedValue
            }
          } catch (error) {
            // Fall back to basic name if detection fails
          }
        }
      }

      // Format the value for display
      let displayValue = actualValue
      if (edge.targetNodeInfo?.type === 'string' && typeof actualValue === 'string' && !actualValue.startsWith('[')) {
        // Quote string values for display, handle empty strings properly
        displayValue = `"${actualValue}"`
      } else if (edge.targetNodeInfo?.type === 'number') {
        const parsed = Number(actualValue)
        if (Number.isFinite(parsed)) {
          // keep as number for display in examination output
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          displayValue = parsed
        }
      }

      return {
        name: edge.edgeName,
        value: displayValue,
        targetType: edge.targetNodeInfo?.type || null,
      }
    })

  return {
    nodeIndex,
    nodeId: node.id,
    node,
    nodeName,
    nodeType,
    edges: processedEdges,
    properties,
  }
}

/**
 * Analyzes a heap snapshot file and examines a specific node by ID
 * @param filePath - Path to the heap snapshot file
 * @param nodeId - The ID of the node to examine
 * @returns Promise that resolves to the examination result or null if not found
 */
export const analyzeNodeFromFile = async (filePath: string, nodeId: number): Promise<NodeExaminationResult | null> => {
  const { prepareHeapSnapshot } = await import('../PrepareHeapSnapshot/PrepareHeapSnapshot.ts')

  try {
    // @ts-ignore minimal typing for migration
    const snapshot: any = await prepareHeapSnapshot(filePath, { parseStrings: true })
    // @ts-ignore minimal typing for migration
    return examineNodeById(nodeId, snapshot as any)
  } catch (error) {
    console.error(`Error loading heap snapshot from ${filePath}:`, error)
    return null
  }
}
