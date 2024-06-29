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
  const nodes = new Uint32Array([0, 0, 0, 0, 0, 0, 0])
  const edges = new Uint32Array()
  expect(ParseHeapSnapshotInternal.parseHeapSnapshotInternal(nodes, edges)).toEqual([
    {
      type: 'node',
      a: 0,
      b: 0,
      c: 0,
      d: 0,
      e: 0,
      f: 0,
      g: 0,
      references: [],
      referrers: [],
    },
  ])
})

test('two nodes', () => {
  // prettier-ignore
  const nodes = new Uint32Array([
    0, 0, 0, 0, 0, 0, 0, // first node
    0, 0, 0, 0, 0, 0, 0 // second node
  ])
  const edges = new Uint32Array()
  expect(ParseHeapSnapshotInternal.parseHeapSnapshotInternal(nodes, edges)).toEqual([
    {
      type: 'node',
      a: 0,
      b: 0,
      c: 0,
      d: 0,
      e: 0,
      f: 0,
      g: 0,
      references: [],
      referrers: [],
    },
    {
      type: 'node',
      a: 0,
      b: 0,
      c: 0,
      d: 0,
      e: 0,
      f: 0,
      g: 0,
      references: [],
      referrers: [],
    },
  ])
})

test.skip('two nodes connected by edge', () => {
  // prettier-ignore
  const nodes = new Uint32Array([
    0, 0, 0, 0, 1, 0, 0, // first node
    0, 0, 0, 0, 0, 0, 0 // second node
  ])
  const edges = new Uint32Array([0, 0, 1])
  expect(ParseHeapSnapshotInternal.parseHeapSnapshotInternal(nodes, edges)).toEqual([
    {
      type: 'node',
      a: 0,
      b: 0,
      c: 0,
      d: 0,
      e: 0,
      f: 0,
      g: 0,
      references: [
        {
          type: 'node',
          a: 0,
          b: 0,
          c: 0,
          d: 0,
          e: 0,
          f: 0,
          g: 0,
          references: [],
          referrers: [],
        },
      ],
      referrers: [],
    },
    {
      type: 'node',
      a: 0,
      b: 0,
      c: 0,
      d: 0,
      e: 0,
      f: 0,
      g: 0,
      references: [],
      referrers: [],
    },
  ])
})
