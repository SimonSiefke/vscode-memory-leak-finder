import * as ParseHeapSnapshotInternal from '../src/parts/ParseHeapSnapshotInternal/ParseHeapSnapshotInternal.js'
import { test, expect } from '@jest/globals'

test('single node', () => {
  const heapsnapshot = {
    snapshot: {
      meta: {
        node_types: [
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
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: ['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak'],
        edge_fields: ['type', 'name_or_index', 'to_node'],
      },
    },
    nodes: [0, 0, 0, 0, 0, 0, 0],
    edges: [],
    strings: ['a'],
  }
  expect(ParseHeapSnapshotInternal.parseHeapSnapshotInternal(heapsnapshot)).toEqual({
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
    0, 1, 1, 0, 0, 0, 0 // second node
  ]
  const edges = []
  const strings = ['a', 'b']
  expect(ParseHeapSnapshotInternal.parseHeapSnapshotInternal(nodes, nodeFields, nodeTypes, edges, edgeFields, edgeTypes, strings)).toEqual({
    graph: {
      0: [],
      1: [],
    },
    parsedNodes: [
      {
        id: 0,
        name: 'a',
        type: 'hidden',
      },
      {
        id: 1,
        name: 'b',
        type: 'hidden',
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
    0, 1, 1, 0, 0, 0, 0 // second node
  ]
  const edges = [0, 0, 7]
  const strings = ['a', 'b']
  expect(ParseHeapSnapshotInternal.parseHeapSnapshotInternal(nodes, nodeFields, nodeTypes, edges, edgeFields, edgeTypes, strings)).toEqual({
    graph: {
      0: [
        {
          index: 1,
          name: 'a',
        },
      ],
      1: [],
    },
    parsedNodes: [
      {
        id: 0,
        name: 'a',
        type: 'hidden',
      },
      {
        id: 1,
        name: 'b',
        type: 'hidden',
      },
    ],
  })
})
