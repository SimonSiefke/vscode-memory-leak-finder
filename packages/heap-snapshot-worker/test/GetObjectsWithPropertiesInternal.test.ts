import { test, expect } from '@jest/globals'
import { getObjectsWithPropertiesInternal } from '../src/parts/GetObjectsWithPropertiesInternal/GetObjectsWithPropertiesInternal.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.js'

test('should find objects with specified property', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 5,
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
      3, 2, 1, 100, 1, 0, 0,  // Object1 with property "test"
      3, 3, 2, 50, 1, 0, 0,   // Object2 with property "test"
      3, 4, 3, 75, 0, 0, 0,   // Object3 without property "test"
      3, 5, 4, 32, 0, 0, 0,   // Property value object for Object1
      3, 6, 5, 32, 0, 0, 0,   // Property value object for Object2
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 1, 3,  // property edge from Object1 to property value object (node index 3, which has id 4)
      2, 1, 4,  // property edge from Object2 to property value object (node index 4, which has id 5)
    ]),
    strings: ['', 'test', 'Object1', 'Object2', 'Object3', 'PropertyValue1', 'PropertyValue2'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'test')

  expect(result).toHaveLength(2)
  expect(result[0]).toEqual({
    id: 1,
    name: 'Object1',
    propertyValue: '[Object 4]',
    type: 'object',
    selfSize: 100,
    edgeCount: 1
  })
  expect(result[1]).toEqual({
    id: 2,
    name: 'Object2',
    propertyValue: '[Object 5]',
    type: 'object',
    selfSize: 50,
    edgeCount: 1
  })
})

test('should return empty array when property not found', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 1,
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
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 1, 0,  // property edge from Object1 to "test" property
    ]),
    strings: ['', 'test', 'Object1'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'nonexistent')

  expect(result).toHaveLength(0)
})

test('should handle string property values', () => {
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
      3, 2, 1, 100, 1, 0, 0,  // Object1
      2, 3, 2, 50, 0, 0, 0,   // String value "hello"
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 1, 1,  // property edge from Object1 to string value
    ]),
    strings: ['', 'test', 'Object1', 'hello'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'test')

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    id: 1,
    name: 'Object1',
    propertyValue: 'hello',
    type: 'object',
    selfSize: 100,
    edgeCount: 1
  })
})

test('should handle number property values', () => {
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
      3, 2, 1, 100, 1, 0, 0,  // Object1
      7, 42, 2, 50, 0, 0, 0,  // Number value 42
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 1, 1,  // property edge from Object1 to number value
    ]),
    strings: ['', 'test', 'Object1', '42'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'test')

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    id: 1,
    name: 'Object1',
    propertyValue: '42',
    type: 'object',
    selfSize: 100,
    edgeCount: 1
  })
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

  const result = getObjectsWithPropertiesInternal(snapshot, 'test')

  expect(result).toHaveLength(0)
})
