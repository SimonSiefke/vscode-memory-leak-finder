import { test, expect } from '@jest/globals'
import * as GetArraysFromHeapSnapshotInternal from '../src/parts/GetArraysFromHeapSnapshotInternal/GetArraysFromHeapSnapshotInternal.js'

test('getArraysFromHeapSnapshotInternal - returns array of names when multiple variables reference same array', () => {
  // Mock heap snapshot data for scenario: globalThis.tecino = [1,2,3]; globalThis.taka = globalThis.tecino;

  // Mock strings array (indices for various strings)
  const strings = [
    '', // 0
    'object', // 1
    'Array', // 2
    'taka', // 3
    'tecino', // 4
    'globalThis', // 5
  ]

  // Mock node types - needs to be wrapped in array
  const node_types = [['synthetic', 'jsobject', 'jsclosure', 'jsregexp', 'jsnumber', 'jsstring', 'jsobject', 'object']]

  // Mock node fields
  const node_fields = ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness']

  // Mock edge types - needs to be wrapped in array
  const edge_types = [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']]

  // Mock edge fields
  const edge_fields = ['type', 'name_or_index', 'to_node']

  // Mock nodes array: [type, name, id, self_size, edge_count, trace_node_id, detachedness]
  // Node indices will be: globalThis at 0, Array at 7
  const nodes = [
    // globalThis node at index 0
    7, 5, 1, 100, 2, 0, 0, // type=object(7), name=globalThis(5), id=1, selfSize=100, edgeCount=2
    // Array node at index 7
    7, 2, 2, 64, 3, 0, 0,  // type=object(7), name=Array(2), id=2, selfSize=64, edgeCount=3
  ]

  // Mock edges array: [type, name_or_index, to_node]
  // Edges from globalThis to Array via 'taka' and 'tecino' properties
  const edges = [
    // globalThis -> Array via 'taka' property
    2, 3, 7, // type=property(2), name_or_index=3 ('taka'), to_node=7 (Array node at index 7)
    // globalThis -> Array via 'tecino' property
    2, 4, 7, // type=property(2), name_or_index=4 ('tecino'), to_node=7 (Array node at index 7)
    // Array internal edges (element edges for array elements)
    1, 0, 14, // type=element(1), name_or_index=0, to_node=14 (some number node)
    1, 1, 21, // type=element(1), name_or_index=1, to_node=21 (some number node)
    1, 2, 28, // type=element(1), name_or_index=2, to_node=28 (some number node)
  ]

  // Mock parsed nodes and graph (simplified)
  const parsedNodes = [
    { id: 1, name: 'globalThis', type: 'object' },
    { id: 2, name: 'Array', type: 'object' }
  ]

  const graph = {
    1: [
      { name: 'taka', index: 1 }, // globalThis.taka -> Array
      { name: 'tecino', index: 1 } // globalThis.tecino -> Array
    ],
    2: []
  }

  const result = GetArraysFromHeapSnapshotInternal.getArraysFromHeapSnapshotInternal(
    strings, nodes, node_types, node_fields, edges, edge_types, edge_fields, parsedNodes, graph
  )

  expect(Array.isArray(result)).toBe(true)
  expect(result.length).toBe(1) // Should find one array

    const arrayResult = result[0]
  expect(arrayResult.id).toBe(2)
  expect(arrayResult.length).toBe(3) // Array has 3 elements
  expect(arrayResult.type).toBe('array')

  // Most importantly: name should be an array containing both variable names
  expect(Array.isArray(arrayResult.name)).toBe(true)
  expect(arrayResult.name).toEqual(['taka', 'tecino']) // Should be sorted alphabetically

  // Should not have selfSize, edgeCount, detachedness, or variableNames
  expect(arrayResult.selfSize).toBeUndefined()
  expect(arrayResult.edgeCount).toBeUndefined()
  expect(arrayResult.detachedness).toBeUndefined()
  expect(arrayResult.variableNames).toBeUndefined()
})

test('getArraysFromHeapSnapshotInternal - falls back to single name when only one variable references array', () => {
  // Mock heap snapshot data for scenario: globalThis.singleArray = [1,2,3];

  const strings = ['', 'object', 'Array', 'singleArray', 'globalThis']
  const node_types = [['synthetic', 'jsobject', 'jsclosure', 'jsregexp', 'jsnumber', 'jsstring', 'jsobject', 'object']]
  const node_fields = ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness']
  const edge_types = [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']]
  const edge_fields = ['type', 'name_or_index', 'to_node']

  const nodes = [
    7, 4, 1, 100, 1, 0, 0, // globalThis
    7, 2, 2, 64, 3, 0, 0,  // Array
  ]

  const edges = [
    2, 3, 7, // globalThis -> Array via 'singleArray'
    1, 0, 14, // Array element 0
    1, 1, 21, // Array element 1
    1, 2, 28, // Array element 2
  ]

  const parsedNodes = [
    { id: 1, name: 'globalThis', type: 'object' },
    { id: 2, name: 'Array', type: 'object' }
  ]

  const graph = {
    1: [{ name: 'singleArray', index: 1 }],
    2: []
  }

  const result = GetArraysFromHeapSnapshotInternal.getArraysFromHeapSnapshotInternal(
    strings, nodes, node_types, node_fields, edges, edge_types, edge_fields, parsedNodes, graph
  )

  expect(Array.isArray(result)).toBe(true)
  expect(result.length).toBe(1)

  const arrayResult = result[0]
  expect(arrayResult.name).toBe('singleArray') // Should be a string when only one name
  expect(typeof arrayResult.name).toBe('string')

  // Should not have removed properties
  expect(arrayResult.selfSize).toBeUndefined()
  expect(arrayResult.edgeCount).toBeUndefined()
  expect(arrayResult.detachedness).toBeUndefined()
  expect(arrayResult.variableNames).toBeUndefined()
})