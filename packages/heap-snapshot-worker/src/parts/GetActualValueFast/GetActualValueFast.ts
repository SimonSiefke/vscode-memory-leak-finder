import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { getNodeEdgesFast } from '../GetNodeEdgesFast/GetNodeEdgesFast.ts'
import { parseNode } from '../ParseNode/ParseNode.ts'
import { getNodeName } from '../GetNodeName/GetNodeName.ts'
import { getNodeTypeName } from '../GetNodeTypeName/GetNodeTypeName.ts'
import { getBooleanValue } from '../GetBooleanValue/GetBooleanValue.ts'
import { getUndefinedValue } from '../GetUndefinedValue/GetUndefinedValue.ts'

export const getActualValueFast = (
  targetNode: any,
  snapshot: Snapshot,
  edgeMap: Uint32Array,
  visited: Set<number>,
  targetNodeIndex: number,
  nodeFields: readonly string[],
  nodeTypes: readonly (readonly string[])[],
  edgeFields: readonly string[],
  strings: readonly string[],
  ITEMS_PER_NODE: number,
  ITEMS_PER_EDGE: number,
  idFieldIndex: number,
  edgeCountFieldIndex: number,
  edgeTypeFieldIndex: number,
  edgeNameFieldIndex: number,
  edgeToNodeFieldIndex: number,
  EDGE_TYPE_INTERNAL: number,
  NODE_TYPE_STRING: number,
  NODE_TYPE_NUMBER: number,
  NODE_TYPE_OBJECT: number,
  NODE_TYPE_ARRAY: number,
): string => {
  if (!targetNode || visited.has(targetNode.id)) {
    return `[Circular ${targetNode?.id || 'Unknown'}]`
  }
  visited.add(targetNode.id)

  const { nodes, edges } = snapshot

  const nodeType = targetNode.type
  const nodeTypeName = getNodeTypeName(targetNode, nodeTypes)

  // Strings
  if (nodeType === NODE_TYPE_STRING) {
    const stringValue = getNodeName(targetNode, strings)
    if (stringValue !== null) {
      return stringValue
    }
    return `[String ${targetNode.id}]`
  }

  // Numbers
  if (nodeType === NODE_TYPE_NUMBER) {
    const directName = getNodeName(targetNode, strings)
    const sentinelNumberNames = new Set(['heap number', 'smi number'])
    if (directName && !sentinelNumberNames.has(directName)) {
      return directName
    }

    // Prefer provided node index; if -1, resolve via scan
    let localTargetNodeIndex = targetNodeIndex
    if (localTargetNodeIndex === -1) {
      for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
        if (nodes[i + idFieldIndex] === targetNode.id) {
          localTargetNodeIndex = i / ITEMS_PER_NODE
          break
        }
      }
    }

    if (localTargetNodeIndex !== -1) {
      const nodeEdges = getNodeEdgesFast(
        localTargetNodeIndex,
        edgeMap,
        nodes,
        edges,
        ITEMS_PER_NODE,
        ITEMS_PER_EDGE,
        edgeCountFieldIndex,
      )
      for (let i = 0; i < nodeEdges.length; i += ITEMS_PER_EDGE) {
        const toNode = nodeEdges[i + edgeToNodeFieldIndex]
        const referencedNodeIndex = Math.floor(toNode / ITEMS_PER_NODE)
        const referencedNode = parseNode(referencedNodeIndex, nodes, nodeFields)
        if (referencedNode && referencedNode.type === NODE_TYPE_STRING) {
          const numericString = getNodeName(referencedNode, strings)
          if (numericString !== null) {
            return numericString
          }
        }
      }
    }

    // Fallback: incoming references
    let currentEdgeOffset = 0
    for (let sourceNodeIndex = 0; sourceNodeIndex < nodes.length; sourceNodeIndex += ITEMS_PER_NODE) {
      const sourceEdgeCount = nodes[sourceNodeIndex + edgeCountFieldIndex]
      for (let j = 0; j < sourceEdgeCount; j++) {
        const edgeIndex = (currentEdgeOffset + j) * ITEMS_PER_EDGE
        const edgeToNode = edges[edgeIndex + edgeToNodeFieldIndex]
        const edgeToNodeIndex = Math.floor(edgeToNode / ITEMS_PER_NODE)
        if (edgeToNodeIndex === localTargetNodeIndex) {
          const edgeNameIndex = edges[edgeIndex + edgeNameFieldIndex]
          const isNameIndexInStrings = edgeNameIndex >= 0 && edgeNameIndex < strings.length
          if (isNameIndexInStrings) {
            const maybeNumeric = strings[edgeNameIndex]
            if (maybeNumeric && maybeNumeric !== '' && /^-?\d+(?:\.\d+)?$/.test(maybeNumeric)) {
              return maybeNumeric
            }
          }
        }
      }
      currentEdgeOffset += sourceEdgeCount
    }

    const fallbackName = getNodeName(targetNode, strings)
    if (fallbackName === null && typeof targetNode.name === 'number' && Number.isFinite(targetNode.name)) {
      return targetNode.name.toString()
    }
    return `[Number ${targetNode.id}]`
  }

  // Hidden: boolean/undefined
  if (nodeTypeName === 'hidden') {
    const booleanValue = getBooleanValue(targetNode, snapshot, edgeMap)
    if (booleanValue) {
      return booleanValue
    }
    const undefinedValue = getUndefinedValue(targetNode, snapshot, edgeMap)
    if (undefinedValue) {
      return undefinedValue
    }
  }

  // Code: follow internal edges
  if (nodeTypeName === 'code') {
    let localTargetNodeIndex = targetNodeIndex
    if (localTargetNodeIndex === -1) {
      for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
        if (nodes[i + idFieldIndex] === targetNode.id) {
          localTargetNodeIndex = i / ITEMS_PER_NODE
          break
        }
      }
    }

    if (localTargetNodeIndex !== -1) {
      const nodeEdges = getNodeEdgesFast(
        localTargetNodeIndex,
        edgeMap,
        nodes,
        edges,
        ITEMS_PER_NODE,
        ITEMS_PER_EDGE,
        edgeCountFieldIndex,
      )
      const internalStringValues: string[] = []
      const incomingStringValues: string[] = []
      const numberValues: string[] = []

      for (let i = 0; i < nodeEdges.length; i += ITEMS_PER_EDGE) {
        const edgeType = nodeEdges[i + edgeTypeFieldIndex]
        if (edgeType === EDGE_TYPE_INTERNAL) {
          const toNode = nodeEdges[i + edgeToNodeFieldIndex]
          const referencedNodeIndex = Math.floor(toNode / ITEMS_PER_NODE)
          const referencedNode = parseNode(referencedNodeIndex, nodes, nodeFields)
          if (referencedNode) {
            const referencedType = referencedNode.type
            if (referencedType === NODE_TYPE_STRING) {
              const stringValue = getNodeName(referencedNode, strings)
              if (stringValue) {
                internalStringValues.push(stringValue)
              }
            } else if (referencedType === NODE_TYPE_NUMBER) {
              const numberValue = referencedNode.name?.toString()
              if (numberValue) {
                numberValues.push(numberValue)
              }
            } else if (referencedType === NODE_TYPE_OBJECT) {
              return `[Object ${referencedNode.id}]`
            } else if (referencedType === NODE_TYPE_ARRAY) {
              return `[Array ${referencedNode.id}]`
            }
          }
        }
      }

      // Also check incoming references
      let currentEdgeOffset = 0
      for (let sourceNodeIndex = 0; sourceNodeIndex < nodes.length; sourceNodeIndex += ITEMS_PER_NODE) {
        const sourceEdgeCount = nodes[sourceNodeIndex + edgeCountFieldIndex]
        for (let j = 0; j < sourceEdgeCount; j++) {
          const edgeIndex = (currentEdgeOffset + j) * ITEMS_PER_EDGE
          const edgeToNode = edges[edgeIndex + edgeToNodeFieldIndex]
          const edgeToNodeIndex = Math.floor(edgeToNode / ITEMS_PER_NODE)
          if (edgeToNodeIndex === localTargetNodeIndex) {
            const edgeType = edges[edgeIndex + edgeTypeFieldIndex]
            const edgeNameIndex = edges[edgeIndex + edgeNameFieldIndex]
            if (edgeType === EDGE_TYPE_INTERNAL && edgeNameIndex < strings.length) {
              const edgeName = strings[edgeNameIndex]
              if (edgeName && edgeName !== '') {
                incomingStringValues.push(edgeName)
              }
            }
          }
        }
        currentEdgeOffset += sourceEdgeCount
      }

      const allIncomingValues = [...incomingStringValues]
      const allInternalValues = [...internalStringValues]
      const oneIndex = allIncomingValues.indexOf('1')
      if (oneIndex !== -1) {
        return '"1"'
      }
      if (allIncomingValues.length > 0) {
        return `"${allIncomingValues[0]}"`
      } else if (allInternalValues.length > 0) {
        return `"${allInternalValues[0]}"`
      } else if (numberValues.length > 0) {
        return numberValues[0]
      }
    }
  }

  if (nodeType === NODE_TYPE_OBJECT) {
    return `[Object ${targetNode.id}]`
  } else if (nodeType === NODE_TYPE_ARRAY) {
    return `[Array ${targetNode.id}]`
  } else {
    return `[${nodeTypeName || 'Unknown'} ${targetNode.id}]`
  }
}


