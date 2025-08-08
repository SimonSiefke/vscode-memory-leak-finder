import { test, expect } from '@jest/globals'
import { getObjectsWithPropertiesInternal } from '../src/parts/GetObjectsWithPropertiesInternal/GetObjectsWithPropertiesInternal.js'
import { Snapshot } from '../src/parts/Snapshot/Snapshot.js'

// Mock heap snapshot data for testing
const createMockHeapSnapshotData = (): Snapshot => ({
  nodes: new Uint32Array([
    // Node 0: object with id 1
    3, 0, 1, 16, 1, 0, 0,
    // Node 1: string with id 2  
    2, 1, 2, 8, 0, 0, 0,
    // Node 2: number with id 3
    8, 2, 3, 8, 0, 0, 0
  ]),
  edges: new Uint32Array([
    // Edge 0: property "test" from node 0 to node 1 (string)
    2, 3, 1,
    // Edge 1: property "value" from node 0 to node 2 (number)
    2, 4, 2
  ]),
  strings: [
    '',
    'Object1',
    'test',
    'value'
  ],
  meta: {
    node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
    node_types: [
      ['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native', 'synthetic']
    ],
    edge_fields: ['type', 'name_or_index', 'to_node'],
    edge_types: [
      ['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']
    ],
    location_fields: ['object_index', 'script_id', 'line', 'column']
  },
  node_count: 3,
  edge_count: 2,
  extra_native_bytes: 0,
  locations: new Uint32Array([])
})

test('getObjectsWithPropertiesInternal should find objects with existing property', () => {
  const { nodes, edges, strings, meta } = createMockHeapSnapshotData()
  const results = getObjectsWithPropertiesInternal(nodes, edges, strings, meta, 'test')
  
  expect(results).toHaveLength(1)
  expect(results[0]).toEqual({
    id: 2,
    name: 'Object1',
    propertyValue: 'Object1',
    type: 'string',
    selfSize: 8,
    edgeCount: 0
  })
})

test('getObjectsWithPropertiesInternal should find objects with numeric property value', () => {
  const { nodes, edges, strings, meta } = createMockHeapSnapshotData()
  const results = getObjectsWithPropertiesInternal(nodes, edges, strings, meta, 'value')
  
  expect(results).toHaveLength(1)
  expect(results[0]).toEqual({
    id: 3,
    name: null,
    propertyValue: '2', // number value converted to string
    type: 'number',
    selfSize: 8,
    edgeCount: 0
  })
})

test('getObjectsWithPropertiesInternal should return empty array for non-existent property', () => {
  const { nodes, edges, strings, meta } = createMockHeapSnapshotData()
  const results = getObjectsWithPropertiesInternal(nodes, edges, strings, meta, 'nonexistent')
  
  expect(results).toHaveLength(0)
})

test('getObjectsWithPropertiesInternal should handle heap snapshot without metadata', () => {
  const nodes = new Uint32Array([])
  const edges = new Uint32Array([])
  const strings: readonly string[] = []
  const meta = {
    node_fields: [],
    node_types: [],
    edge_fields: [],
    edge_types: [],
    location_fields: []
  }
  
  const results = getObjectsWithPropertiesInternal(nodes, edges, strings, meta, 'test')
  expect(results).toHaveLength(0)
})

test('getObjectsWithPropertiesInternal should handle object type property values', () => {
  const nodes = new Uint32Array([
    // Node 0: object with id 1
    3, 0, 1, 16, 1, 0, 0,
    // Node 1: object with id 2
    3, 1, 2, 24, 0, 0, 0
  ])
  const edges = new Uint32Array([
    // Edge 0: property "obj" from node 0 to node 1 (object)
    2, 2, 1
  ])
  const strings = [
    '',
    'obj'
  ]
  const meta = {
    node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
    node_types: [
      ['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native', 'synthetic']
    ],
    edge_fields: ['type', 'name_or_index', 'to_node'],
    edge_types: [
      ['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']
    ],
    location_fields: ['object_index', 'script_id', 'line', 'column']
  }
  
  const results = getObjectsWithPropertiesInternal(nodes, edges, strings, meta, 'obj')
  expect(results).toHaveLength(1)
  expect(results[0].propertyValue).toBe('[Object 2]')
  expect(results[0].type).toBe('object')
})

test('getObjectsWithPropertiesInternal should handle array type property values', () => {
  const nodes = new Uint32Array([
    // Node 0: object with id 1
    3, 0, 1, 16, 1, 0, 0,
    // Node 1: array with id 2
    1, 1, 2, 32, 0, 0, 0
  ])
  const edges = new Uint32Array([
    // Edge 0: property "arr" from node 0 to node 1 (array)
    2, 2, 1
  ])
  const strings = [
    '',
    'arr'
  ]
  const meta = {
    node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
    node_types: [
      ['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native', 'synthetic']
    ],
    edge_fields: ['type', 'name_or_index', 'to_node'],
    edge_types: [
      ['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']
    ],
    location_fields: ['object_index', 'script_id', 'line', 'column']
  }
  
  const results = getObjectsWithPropertiesInternal(nodes, edges, strings, meta, 'arr')
  expect(results).toHaveLength(1)
  expect(results[0].propertyValue).toBe('[Array 2]')
  expect(results[0].type).toBe('array')
})

test('getObjectsWithPropertiesInternal should handle unknown type property values', () => {
  const nodes = new Uint32Array([
    // Node 0: object with id 1
    3, 0, 1, 16, 1, 0, 0,
    // Node 1: code with id 2 (type 4)
    4, 1, 2, 64, 0, 0, 0
  ])
  const edges = new Uint32Array([
    // Edge 0: property "func" from node 0 to node 1 (code)
    2, 2, 1
  ])
  const strings = [
    '',
    'func'
  ]
  const meta = {
    node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
    node_types: [
      ['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native', 'synthetic']
    ],
    edge_fields: ['type', 'name_or_index', 'to_node'],
    edge_types: [
      ['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']
    ],
    location_fields: ['object_index', 'script_id', 'line', 'column']
  }
  
  const results = getObjectsWithPropertiesInternal(nodes, edges, strings, meta, 'func')
  expect(results).toHaveLength(1)
  expect(results[0].propertyValue).toBe('[code 2]')
  expect(results[0].type).toBe('code')
})
