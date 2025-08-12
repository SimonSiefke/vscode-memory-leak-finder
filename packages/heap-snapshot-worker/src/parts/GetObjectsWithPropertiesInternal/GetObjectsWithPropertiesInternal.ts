import { collectObjectProperties } from '../CollectObjectProperties/CollectObjectProperties.ts'
import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import { getActualValue } from '../GetActualValue/GetActualValue.ts'
import { getBooleanStructure } from '../GetBooleanValue/GetBooleanValue.ts'
import { getNodeName } from '../GetNodeName/GetNodeName.ts'
import { getNodeTypeName } from '../GetNodeTypeName/GetNodeTypeName.ts'
import type { ObjectWithProperty } from '../ObjectWithProperty/ObjectWithProperty.ts'
import { parseNode } from '../ParseNode/ParseNode.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { getObjectWithPropertyNodeIndices } from '../GetObjectWithPropertyNodeIndices/GetObjectWithPropertyNodeIndices.ts'
import { getNodeEdges } from '../GetNodeEdges/GetNodeEdges.ts'
import { getNodePreviews } from '../GetNodePreviews/GetNodePreviews.ts'

/**
 * Internal function that finds objects in a parsed heap snapshot that have a specific property
 * @param snapshot - The parsed heap snapshot object
 * @param propertyName - The property name to search for
 * @param depth - Maximum depth to traverse for property collection (default: 1)
 * @returns Array of objects with the specified property
 */
export const getObjectsWithPropertiesInternal = (snapshot: Snapshot, propertyName: string, depth: number = 1): ObjectWithProperty[] => {
  const { nodes, edges, strings, meta } = snapshot

  const nodeFields = meta.node_fields
  const nodeTypes = meta.node_types
  const edgeFields = meta.edge_fields

  if (!nodeFields.length || !edgeFields.length) {
    return results
  }

  const ITEMS_PER_NODE = nodeFields.length
  const edgeMap = createEdgeMap(nodes, nodeFields)
  const matchingNodeIndices = getObjectWithPropertyNodeIndices(snapshot, propertyName)

  const results = getNodePreviews(matchingNodeIndices, snapshot, edgeMap, propertyName, depth)

  return results
}
