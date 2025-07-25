import * as ParseHeapSnapshotInternal from '../src/parts/ParseHeapSnapshotInternal/ParseHeapSnapshotInternal.js'
import { test, expect } from '@jest/globals'

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
  const strings = ['a']
  const locations = []
  const locationFields = ['object_index', 'script_id', 'line', 'column']
  expect(
    ParseHeapSnapshotInternal.parseHeapSnapshotInternal(
      nodes,
      nodeFields,
      nodeTypes,
      edges,
      edgeFields,
      edgeTypes,
      strings,
      locations,
      locationFields,
    ),
  ).toEqual({
    locations: [],
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
  const locations = []
  const locationFields = ['object_index', 'script_id', 'line', 'column']
  expect(
    ParseHeapSnapshotInternal.parseHeapSnapshotInternal(
      nodes,
      nodeFields,
      nodeTypes,
      edges,
      edgeFields,
      edgeTypes,
      strings,
      locations,
      locationFields,
    ),
  ).toEqual({
    graph: {
      0: [],
      1: [],
    },
    locations: [],
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
  const locations = []
  const locationFields = ['object_index', 'script_id', 'line', 'column']
  expect(
    ParseHeapSnapshotInternal.parseHeapSnapshotInternal(
      nodes,
      nodeFields,
      nodeTypes,
      edges,
      edgeFields,
      edgeTypes,
      strings,
      locations,
      locationFields,
    ),
  ).toEqual({
    graph: {
      0: [
        {
          index: 1,
          name: 'a',
        },
      ],
      1: [],
    },
    locations: [],
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
