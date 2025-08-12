import { collectObjectProperties } from '../CollectObjectProperties/CollectObjectProperties.ts'
import { getActualValue } from '../GetActualValue/GetActualValue.ts'
import { getBooleanStructure } from '../GetBooleanValue/GetBooleanValue.ts'
import { getNodeEdges } from '../GetNodeEdges/GetNodeEdges.ts'
import { getNodeName } from '../GetNodeName/GetNodeName.ts'
import { getNodeTypeName } from '../GetNodeTypeName/GetNodeTypeName.ts'
import type { ObjectWithProperty } from '../ObjectWithProperty/ObjectWithProperty.ts'
import { parseNode } from '../ParseNode/ParseNode.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

/**
 * Builds result objects (including preview) for a list of node indices using the provided edge map and depth.
 * Also resolves the value for the given property on each node.
 */
export const getNodePreviews = (
  nodeIndices: readonly number[],
  snapshot: Snapshot,
  edgeMap: Uint32Array,
  propertyName: string,
  depth: number,
): ObjectWithProperty[] => {
  const { nodes, edges, strings, meta } = snapshot

  const nodeFields = meta.node_fields
  const nodeTypes = meta.node_types
  const edgeFields = meta.edge_fields
  const edgeTypes = meta.edge_types[0] || []

  const ITEMS_PER_NODE = nodeFields.length
  const ITEMS_PER_EDGE = edgeFields.length
  const edgeTypeFieldIndex = edgeFields.indexOf('type')
  const edgeNameFieldIndex = edgeFields.indexOf('name_or_index')
  const edgeToNodeFieldIndex = edgeFields.indexOf('to_node')
  const EDGE_TYPE_PROPERTY = edgeTypes.indexOf('property')
  const propertyNameIndex = strings.findIndex((s) => s === propertyName)

  const results: ObjectWithProperty[] = []

  for (const sourceNodeIndex of nodeIndices) {
    const sourceNode = parseNode(sourceNodeIndex, nodes, nodeFields)
    if (!sourceNode) {
      continue
    }

    const result: ObjectWithProperty = {
      id: sourceNode.id,
      name: getNodeName(sourceNode, strings),
      propertyValue: null,
      type: getNodeTypeName(sourceNode, nodeTypes),
      selfSize: sourceNode.self_size,
      edgeCount: sourceNode.edge_count,
    }

    const booleanStructure = getBooleanStructure(sourceNode, snapshot, edgeMap, propertyName)
    if (booleanStructure) {
      if (booleanStructure.value === 'true') {
        result.propertyValue = true
      } else if (booleanStructure.value === 'false') {
        result.propertyValue = false
      } else {
        result.propertyValue = booleanStructure.value
      }
    } else if (propertyNameIndex !== -1) {
      const nodeEdges = getNodeEdges(sourceNodeIndex, edgeMap, nodes, edges, nodeFields, edgeFields)
      let targetNodeIndex: number | undefined
      for (let i = 0; i < nodeEdges.length; i += ITEMS_PER_EDGE) {
        const edgeType = nodeEdges[i + edgeTypeFieldIndex]
        const nameIndex = nodeEdges[i + edgeNameFieldIndex]
        if (edgeType === EDGE_TYPE_PROPERTY && nameIndex === propertyNameIndex) {
          const toNode = nodeEdges[i + edgeToNodeFieldIndex]
          targetNodeIndex = Math.floor(toNode / ITEMS_PER_NODE)
          break
        }
      }

      if (typeof targetNodeIndex === 'number') {
        const targetNode = parseNode(targetNodeIndex, nodes, nodeFields)
        const targetTypeName = getNodeTypeName(targetNode, nodeTypes)
        const actualValue = getActualValue(targetNode, snapshot, edgeMap)
        if (actualValue === 'true') {
          result.propertyValue = true
        } else if (actualValue === 'false') {
          result.propertyValue = false
        } else if (targetTypeName === 'number') {
          const parsed = Number(actualValue)
          result.propertyValue = Number.isFinite(parsed) ? parsed : actualValue
        } else {
          result.propertyValue = actualValue
        }
      }
    }

    if (depth > 0) {
      result.preview = collectObjectProperties(sourceNodeIndex, snapshot, edgeMap, depth)
    }

    results.push(result)
  }

  return results
}
