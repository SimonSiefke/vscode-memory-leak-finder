import type { AstNode } from '../AstNode/AstNode.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import { buildAstForNode } from '../GetNodePreviews/GetNodePreviewsAst.ts'

export const getAsts = (snapshot: Snapshot, uniqueIndices: Uint32Array, depth: number): readonly any[] => {
  const { meta, nodes } = snapshot
  const nodeFields = meta.node_fields
  const edgeFields = meta.edge_fields
  if (nodeFields.length === 0 || edgeFields.length === 0) {
    return []
  }
  const edgeMap = createEdgeMap(nodes, nodeFields)
  const { strings } = snapshot
  const nodeTypes = meta.node_types
  const edgeTypes = meta.edge_types[0] || []
  const ITEMS_PER_NODE = nodeFields.length
  const ITEMS_PER_EDGE = edgeFields.length
  const edgeCountFieldIndex = nodeFields.indexOf('edge_count')
  const edgeTypeFieldIndex = edgeFields.indexOf('type')
  const edgeNameFieldIndex = edgeFields.indexOf('name_or_index')
  const edgeToNodeFieldIndex = edgeFields.indexOf('to_node')
  const EDGE_TYPE_PROPERTY = edgeTypes.indexOf('property')
  const EDGE_TYPE_INTERNAL = edgeTypes.indexOf('internal')
  const nodeFieldCount = nodeFields.length
  const asts: AstNode[] = []
  for (const absoluteNodeIndex of uniqueIndices) {
    const ast = buildAstForNode(
      absoluteNodeIndex / nodeFieldCount,
      snapshot,
      edgeMap,
      nodeFields,
      nodeTypes,
      edgeFields,
      strings,
      ITEMS_PER_NODE,
      ITEMS_PER_EDGE,
      edgeCountFieldIndex,
      edgeTypeFieldIndex,
      edgeNameFieldIndex,
      edgeToNodeFieldIndex,
      EDGE_TYPE_PROPERTY,
      EDGE_TYPE_INTERNAL,
      depth,
      new Set(),
    )
    if (ast) {
      asts.push(ast)
    }
  }

  return asts
}
