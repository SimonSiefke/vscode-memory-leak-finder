import * as ParseHeapSnapshotInternal from '../src/parts/ParseHeapSnapshotInternal/ParseHeapSnapshotInternal.js'

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
  const edgeFields = ['type', 'name_or_index', 'to_node']
  const edgeTypes = ['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']
  const nodes = [0, 0, 0, 0, 0, 0, 0]
  const edges = []
  expect(ParseHeapSnapshotInternal.parseHeapSnapshotInternal(nodes, nodeFields, nodeTypes, edges, edgeFields, edgeTypes)).toEqual({
    graph: { 0: [] },
    parsedNodes: [{ detachedness: 0, edgeCount: 0, id: 0, name: 0, selfSize: 0, traceNodeId: 0, type: 0 }],
  })
})

test('two nodes', () => {
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
  const edgeFields = ['type', 'name_or_index', 'to_node']
  const edgeTypes = ['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']
  // prettier-ignore
  const nodes = [
    0, 0, 0, 0, 0, 0, 0, // first node
    0, 0, 1, 0, 0, 0, 0 // second node
  ]
  const edges = []
  expect(ParseHeapSnapshotInternal.parseHeapSnapshotInternal(nodes, nodeFields, nodeTypes, edges, edgeFields, edgeTypes)).toEqual({
    graph: {
      0: [],
      1: [],
    },
    parsedNodes: [
      {
        detachedness: 0,
        edgeCount: 0,
        id: 0,
        name: 0,
        selfSize: 0,
        traceNodeId: 0,
        type: 0,
      },
      {
        detachedness: 0,
        edgeCount: 0,
        id: 1,
        name: 0,
        selfSize: 0,
        traceNodeId: 0,
        type: 0,
      },
    ],
  })
})

test('two nodes connected by edge', () => {
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
  const edgeFields = ['type', 'name_or_index', 'to_node']
  const edgeTypes = ['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']
  // prettier-ignore
  const nodes = [
    0, 0, 0, 0, 1, 0, 0, // first node
    0, 0, 1, 0, 0, 0, 0 // second node
  ]
  const edges = [0, 0, 1]
  expect(ParseHeapSnapshotInternal.parseHeapSnapshotInternal(nodes, nodeFields, nodeTypes, edges, edgeFields, edgeTypes)).toEqual({
    graph: {
      0: [1],
      1: [],
    },
    parsedNodes: [
      {
        detachedness: 0,
        edgeCount: 1,
        id: 0,
        name: 0,
        selfSize: 0,
        traceNodeId: 0,
        type: 0,
      },
      {
        detachedness: 0,
        edgeCount: 0,
        id: 1,
        name: 0,
        selfSize: 0,
        traceNodeId: 0,
        type: 0,
      },
    ],
  })
})
