import type { Snapshot } from '../../src/parts/Snapshot/Snapshot.ts'

export const createTestSnapshot = (
  nodes: Uint32Array,
  edges: Uint32Array,
  strings: string[],
  nodeFields: string[] = ['type', 'name', 'id', 'self_size', 'edge_count'],
  edgeFields: string[] = ['type', 'name_or_index', 'to_node'],
  nodeTypes: [readonly string[]] = [['object', 'string', 'hidden']],
  edgeTypes: [readonly string[]] = [['property', 'internal']]
): Snapshot => ({
  nodes,
  edges,
  strings,
  edge_count: edges.length / edgeFields.length,
  node_count: nodes.length / nodeFields.length,
  extra_native_bytes: 0,
  locations: new Uint32Array([]),
  meta: {
    node_fields: nodeFields,
    edge_fields: edgeFields,
    node_types: nodeTypes,
    edge_types: edgeTypes,
    location_fields: []
  }
})
