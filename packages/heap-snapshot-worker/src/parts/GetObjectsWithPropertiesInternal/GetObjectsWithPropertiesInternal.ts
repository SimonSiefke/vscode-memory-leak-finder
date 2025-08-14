import { getObjectsWithPropertiesInternalAst } from '../GetObjectsWithPropertiesInternalAst/GetObjectsWithPropertiesInternalAst.ts'
import { printAstRoots } from '../PrintAst/PrintAst.ts'
import type { PrintedValue } from '../PrintedValue/PrintedValue.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import * as Timing from '../Timing/Timing.ts'

/**
 * Internal function that finds objects in a parsed heap snapshot that have a specific property
 * @param snapshot - The parsed heap snapshot object
 * @param propertyName - The property name to search for
 * @param depth - Maximum depth to traverse for property collection (default: 1)
 * @returns Array of objects with the specified property
 */
export const getObjectsWithPropertiesInternal = (snapshot: Snapshot, propertyName: string, depth: number = 1): readonly PrintedValue[] => {
  const tTotal = Timing.timeStart('GetObjectsWithPropertiesInternal.total')
  const { meta } = snapshot

  const nodeFields = meta.node_fields
  const edgeFields = meta.edge_fields

  if (!nodeFields.length || !edgeFields.length) {
    return []
  }

  const tEdgeMap = Timing.timeStart('CreateEdgeMap.total')
  Timing.timeEnd('CreateEdgeMap.total', tEdgeMap)

  // Precompute traversal indices and constants once

  const tMatching = Timing.timeStart('GetObjectWithPropertyNodeIndices.total')
  Timing.timeEnd('GetObjectWithPropertyNodeIndices.total', tMatching)

  // Build AST first, then print (for future use or external consumers)
  const tAst = Timing.timeStart('GetObjectsWithPropertiesInternal.ast')
  const astRoots = getObjectsWithPropertiesInternalAst(snapshot, propertyName, depth)
  Timing.timeEnd('GetObjectsWithPropertiesInternal.ast', tAst)
  const tPrint = Timing.timeStart('GetObjectsWithPropertiesInternal.print')
  // Currently not used for the returned structure to keep API compatibility
  const preview = printAstRoots(astRoots)
  Timing.timeEnd('GetObjectsWithPropertiesInternal.print', tPrint)

  const tPreviews = Timing.timeStart('GetNodePreviews.total')

  Timing.timeEnd('GetNodePreviews.total', tPreviews)

  Timing.timeEnd('GetObjectsWithPropertiesInternal.total', tTotal)
  return preview
}
