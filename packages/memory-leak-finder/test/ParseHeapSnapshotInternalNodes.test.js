import * as ParseHeapSnapshotInternalNodes from '../src/parts/ParseHeapSnapshotInternalNodes/ParseHeapSnapshotInternalNodes.js'

test('single node', () => {
  const nodeFields = ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness']
  const nodeTypes = [
    'hidden',
    'array',
    'string',
    'object',
    'code',
    'closure',
    'regexp',
    'number',
    'native',
    'synthetic',
    'concatenated string',
    'sliced string',
    'symbol',
    'bigint',
    'object shape',
  ]
  const nodes = [0, 0, 0, 0, 0, 0, 0]
  const strings = ['a']
  expect(ParseHeapSnapshotInternalNodes.parseHeapSnapshotInternalNodes(nodes, nodeFields, nodeTypes, strings)).toEqual([
    {
      detachedness: 0,
      edgeCount: 0,
      id: 0,
      name: 'a',
      selfSize: 0,
      traceNodeId: 0,
      type: 'hidden',
    },
  ])
})
