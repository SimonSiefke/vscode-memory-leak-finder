import { test, expect } from '@jest/globals'
import { getObjectWithPropertyNodeIndices } from '../src/parts/GetObjectWithPropertyNodeIndices/GetObjectWithPropertyNodeIndices.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.js'

test('should find objects with specified property', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 3,
    edge_count: 2,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native', 'synthetic', 'concatenated string', 'sliced string', 'symbol', 'bigint']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column']
    },
    nodes: new Uint32Array([
      // type, name, id, self_size, edge_count, trace_node_id, detachedness
      3, 1, 1, 100, 1, 0, 0,  // Object1 with property "test"
      3, 2, 2, 50, 1, 0, 0,   // Object2 with property "test"
      3, 3, 3, 75, 0, 0, 0,   // Object3 without property "test"
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 4, 7,  // property edge from Object1 to property value (array index 7 = node index 1 * 7 fields)
      2, 4, 14, // property edge from Object2 to property value (array index 14 = node index 2 * 7 fields)
    ]),
    strings: ['', 'Object1', 'Object2', 'Object3', 'test'],
    locations: new Uint32Array([])
  }

  const result = getObjectWithPropertyNodeIndices(snapshot, 'test')

  expect(result).toHaveLength(2)
  expect(result).toContain(0) // Object1
  expect(result).toContain(1) // Object2
  expect(result).not.toContain(2) // Object3
})

test('should return empty array when property not found', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 1,
    edge_count: 0,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native', 'synthetic', 'concatenated string', 'sliced string', 'symbol', 'bigint']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column']
    },
    nodes: new Uint32Array([
      // type, name, id, self_size, edge_count, trace_node_id, detachedness
      3, 1, 1, 100, 0, 0, 0,  // Object1 without any properties
    ]),
    edges: new Uint32Array([]),
    strings: ['', 'Object1'],
    locations: new Uint32Array([])
  }

  const result = getObjectWithPropertyNodeIndices(snapshot, 'nonexistent')

  expect(result).toHaveLength(0)
})

test('should return empty array when property name not in strings', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 1,
    edge_count: 0,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native', 'synthetic', 'concatenated string', 'sliced string', 'symbol', 'bigint']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column']
    },
    nodes: new Uint32Array([
      // type, name, id, self_size, edge_count, trace_node_id, detachedness
      3, 1, 1, 100, 0, 0, 0,  // Object1
    ]),
    edges: new Uint32Array([]),
    strings: ['', 'Object1'],
    locations: new Uint32Array([])
  }

  const result = getObjectWithPropertyNodeIndices(snapshot, 'missingProperty')

  expect(result).toHaveLength(0)
})

test('should handle empty metadata', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 0,
    edge_count: 0,
    extra_native_bytes: 0,
    meta: {
      node_fields: [],
      node_types: [[]],
      edge_fields: [],
      edge_types: [[]],
      location_fields: []
    },
    nodes: new Uint32Array([]),
    edges: new Uint32Array([]),
    strings: [],
    locations: new Uint32Array([])
  }

  const result = getObjectWithPropertyNodeIndices(snapshot, 'test')

  expect(result).toHaveLength(0)
})

test('should handle custom field indices', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native', 'synthetic', 'concatenated string', 'sliced string', 'symbol', 'bigint']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column']
    },
    nodes: new Uint32Array([
      // type, name, id, self_size, edge_count, trace_node_id, detachedness
      3, 1, 1, 100, 1, 0, 0,  // Object1 with property "test"
      3, 2, 2, 50, 0, 0, 0,   // Object2 without property
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 3, 7,  // property edge from Object1 to property value
    ]),
    strings: ['', 'Object1', 'Object2', 'test'],
    locations: new Uint32Array([])
  }

  // Use custom field indices
  const result = getObjectWithPropertyNodeIndices(
    snapshot,
    'test',
    7, // ITEMS_PER_NODE
    3, // ITEMS_PER_EDGE
    0, // edgeTypeFieldIndex
    1, // edgeNameFieldIndex
    4  // edgeCountFieldIndex
  )

  expect(result).toHaveLength(1)
  expect(result).toContain(0) // Object1
})

test('should handle different edge types correctly', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 3,
    edge_count: 3,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native', 'synthetic', 'concatenated string', 'sliced string', 'symbol', 'bigint']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column']
    },
    nodes: new Uint32Array([
      // type, name, id, self_size, edge_count, trace_node_id, detachedness
      3, 1, 1, 100, 2, 0, 0,  // Object1 with property and element edges
      3, 2, 2, 50, 1, 0, 0,   // Object2 with only property edge
      3, 3, 3, 75, 1, 0, 0,   // Object3 with only element edge
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 4, 7,  // property edge from Object1 to property value
      1, 0, 7,  // element edge from Object1 to array element
      2, 4, 14, // property edge from Object2 to property value
      1, 0, 21, // element edge from Object3 to array element
    ]),
    strings: ['', 'Object1', 'Object2', 'Object3', 'test'],
    locations: new Uint32Array([])
  }

  const result = getObjectWithPropertyNodeIndices(snapshot, 'test')

  expect(result).toHaveLength(2)
  expect(result).toContain(0) // Object1 (has property edge)
  expect(result).toContain(1) // Object2 (has property edge)
  expect(result).not.toContain(2) // Object3 (only has element edge)
})

test('should handle multiple properties on same object', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 2,
    edge_count: 2,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native', 'synthetic', 'concatenated string', 'sliced string', 'symbol', 'bigint']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column']
    },
    nodes: new Uint32Array([
      // type, name, id, self_size, edge_count, trace_node_id, detachedness
      3, 1, 1, 100, 2, 0, 0,  // Object1 with multiple properties
      3, 2, 2, 50, 0, 0, 0,   // Object2
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 3, 7,  // property edge "test" from Object1
      2, 4, 7,  // property edge "other" from Object1
    ]),
    strings: ['', 'Object1', 'Object2', 'test', 'other'],
    locations: new Uint32Array([])
  }

  const result = getObjectWithPropertyNodeIndices(snapshot, 'test')

  expect(result).toHaveLength(1)
  expect(result).toContain(0) // Object1 should appear only once
})

test('should handle property names that are numbers', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native', 'synthetic', 'concatenated string', 'sliced string', 'symbol', 'bigint']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column']
    },
    nodes: new Uint32Array([
      // type, name, id, self_size, edge_count, trace_node_id, detachedness
      3, 1, 1, 100, 1, 0, 0,  // Object1 with numeric property name
      3, 2, 2, 50, 0, 0, 0,   // Object2
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 3, 7,  // property edge "42" from Object1
    ]),
    strings: ['', 'Object1', 'Object2', '42'],
    locations: new Uint32Array([])
  }

  const result = getObjectWithPropertyNodeIndices(snapshot, '42')

  expect(result).toHaveLength(1)
  expect(result).toContain(0) // Object1
})

test('should handle empty strings as property names', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native', 'synthetic', 'concatenated string', 'sliced string', 'symbol', 'bigint']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column']
    },
    nodes: new Uint32Array([
      // type, name, id, self_size, edge_count, trace_node_id, detachedness
      3, 1, 1, 100, 1, 0, 0,  // Object1 with empty string property name
      3, 2, 2, 50, 0, 0, 0,   // Object2
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 0, 7,  // property edge "" (empty string) from Object1
    ]),
    strings: ['', 'Object1', 'Object2'],
    locations: new Uint32Array([])
  }

  const result = getObjectWithPropertyNodeIndices(snapshot, '')

  expect(result).toHaveLength(1)
  expect(result).toContain(0) // Object1
})

test('should handle large number of nodes efficiently', () => {
  const nodeCount = 1000
  const edgeCount = 500
  
  // Create a large snapshot with many nodes
  const nodes = new Uint32Array(nodeCount * 7)
  const edges = new Uint32Array(edgeCount * 3)
  const strings = ['', 'Object', 'testProperty']
  
  // Fill nodes array
  for (let i = 0; i < nodeCount; i++) {
    const offset = i * 7
    nodes[offset] = 3 // type: object
    nodes[offset + 1] = 1 // name: Object
    nodes[offset + 2] = i + 1 // id
    nodes[offset + 3] = 100 // self_size
    nodes[offset + 4] = 1 // edge_count
    nodes[offset + 5] = 0 // trace_node_id
    nodes[offset + 6] = 0 // detachedness
  }
  
  // Fill edges array - every 10th object has the test property
  let edgeIndex = 0
  for (let i = 0; i < nodeCount; i += 10) {
    if (edgeIndex < edgeCount) {
      const edgeOffset = edgeIndex * 3
      edges[edgeOffset] = 2 // type: property
      edges[edgeOffset + 1] = 2 // name_or_index: testProperty
      edges[edgeOffset + 2] = 0 // to_node (dummy value)
      edgeIndex++
    }
  }
  
  const snapshot: Snapshot = {
    node_count: nodeCount,
    edge_count: edgeCount,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native', 'synthetic', 'concatenated string', 'sliced string', 'symbol', 'bigint']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column']
    },
    nodes,
    edges,
    strings,
    locations: new Uint32Array([])
  }

  const result = getObjectWithPropertyNodeIndices(snapshot, 'testProperty')

  // Should find approximately nodeCount/10 objects with the property
  const expectedCount = Math.floor(nodeCount / 10)
  expect(result).toHaveLength(expectedCount)
  
  // Check that the indices are correct (every 10th index)
  for (let i = 0; i < expectedCount; i++) {
    expect(result[i]).toBe(i * 10)
  }
})
