import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import { getNodePreviews } from '../GetNodePreviews/GetNodePreviews.ts'
import { getObjectWithPropertyNodeIndices } from '../GetObjectWithPropertyNodeIndices/GetObjectWithPropertyNodeIndices.ts'
import * as Timing from '../Timing/Timing.ts'
import type { ObjectWithProperty } from '../ObjectWithProperty/ObjectWithProperty.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

/**
 * Internal function that finds objects in a parsed heap snapshot that have a specific property
 * @param snapshot - The parsed heap snapshot object
 * @param propertyName - The property name to search for
 * @param depth - Maximum depth to traverse for property collection (default: 1)
 * @returns Array of objects with the specified property
 */
export const getObjectsWithPropertiesInternal = (snapshot: Snapshot, propertyName: string, depth: number = 1): ObjectWithProperty[] => {
  const tTotal = Timing.timeStart('GetObjectsWithPropertiesInternal.total')
  const { nodes, meta } = snapshot

  const nodeFields = meta.node_fields
  const edgeFields = meta.edge_fields

  if (!nodeFields.length || !edgeFields.length) {
    return []
  }

  const tEdgeMap = Timing.timeStart('CreateEdgeMap.total')
  const edgeMap = createEdgeMap(nodes, nodeFields)
  Timing.timeEnd('CreateEdgeMap.total', tEdgeMap)

  const tMatching = Timing.timeStart('GetObjectWithPropertyNodeIndices.total')
  const matchingNodeIndices = getObjectWithPropertyNodeIndices(snapshot, propertyName)
  Timing.timeEnd('GetObjectWithPropertyNodeIndices.total', tMatching)

  const tPreviews = Timing.timeStart('GetNodePreviews.total')
  const results = getNodePreviews(matchingNodeIndices, snapshot, edgeMap, propertyName, depth)
  Timing.timeEnd('GetNodePreviews.total', tPreviews)

  Timing.timeEnd('GetObjectsWithPropertiesInternal.total', tTotal)
  return results
}
