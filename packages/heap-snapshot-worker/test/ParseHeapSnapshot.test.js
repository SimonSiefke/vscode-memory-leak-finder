import * as ParseHeapSnapshot from '../src/parts/ParseHeapSnapshot/ParseHeapSnapshot.js'
import { test, expect } from '@jest/globals'

test('single node', () => {
  const heapsnapshot = {
    snapshot: {
      meta: {
        node_types: [
          [
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
          ],
        ],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
      },
    },
    nodes: [0, 0, 0, 0, 0, 0, 0],
    edges: [],
    strings: ['a'],
  }
  expect(ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)).toEqual({
    graph: { 0: [] },
    parsedNodes: [
      {
        id: 0,
        name: 'a',
        type: 'hidden',
      },
    ],
  })
})
