import { getArraysFromHeapSnapshotInternal } from '../GetArraysFromHeapSnapshotInternal/GetArraysFromHeapSnapshotInternal.ts'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getArraysFromHeapSnapshot = async (pathUri: string): Promise<any[]> => {
  // @ts-ignore minimal typing for migration
  const snapshot: any = await prepareHeapSnapshot(pathUri, {
    parseStrings: true,
  })

  const { edges, meta, nodes, strings } = snapshot
  const { edge_fields, edge_types, node_fields, node_types } = meta

  // Also get parsed nodes and graph for name mapping
  const { graph, parsedNodes } = ParseHeapSnapshot.parseHeapSnapshot({ edges, nodes, snapshot: { meta }, strings } as any)

  return getArraysFromHeapSnapshotInternal(strings, nodes, node_types, node_fields, edges, edge_types, edge_fields, parsedNodes, graph)
}
