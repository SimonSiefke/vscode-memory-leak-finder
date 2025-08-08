import { test, expect } from '@jest/globals'
import { getObjectsWithPropertiesInternal } from '../src/parts/GetObjectsWithPropertiesInternal/GetObjectsWithPropertiesInternal.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.js'

test('should find objects with specified property', () => {
  const snapshot: Snapshot = {
    node_count: 3,
    edge_count: 2,
    extra_native_bytes: 0,
    // prettier-ignore
    nodes: new Uint32Array([
      // id, name, self_size, edge_count, trace_node_id, detachedness
      1, 1, 100, 2, 0, 0,  // Object1 with property "test"
      2, 2, 50, 1, 0, 0,   // Object2 with property "test"
      3, 3, 75, 0, 0, 0,   // Object3 without property "test"
    ]),
    // prettier-ignore
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 1, 0,  // property edge from Object1 to "test" property
      2, 1, 1,  // property edge from Object2 to "test" property
    ]),
    strings: ['', 'test', 'Object1', 'Object2', 'Object3'],
    locations: new Uint32Array([]),
    meta: {
      node_fields: ['id', 'name', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native', 'synthetic', 'concatenated string', 'sliced string', 'symbol', 'bigint']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column']
    }
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'test')

  expect(result).toHaveLength(2)
  expect(result[0]).toEqual({
    id: 1,
    name: 'Object1',
    propertyValue: '[Object 1]',
    type: 'object',
    selfSize: 100,
    edgeCount: 2
  })
  expect(result[1]).toEqual({
    id: 2,
    name: 'Object2',
    propertyValue: '[Object 2]',
    type: 'object',
    selfSize: 50,
    edgeCount: 1
  })
})

test('should return empty array when property not found', () => {
  const snapshot: Snapshot = {
    node_count: 1,
    edge_count: 1,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['id', 'name', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native', 'synthetic', 'concatenated string', 'sliced string', 'symbol', 'bigint']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column']
    },
    // prettier-ignore
    nodes: new Uint32Array([
      // id, name, self_size, edge_count, trace_node_id, detachedness
      1, 1, 100, 1, 0, 0,  // Object1 with property "test"
    ]),
    // prettier-ignore
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
  const snapshot: Snapshot = {
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['id', 'name', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native', 'synthetic', 'concatenated string', 'sliced string', 'symbol', 'bigint']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column']
    },
    // prettier-ignore
    nodes: new Uint32Array([
      // id, name, self_size, edge_count, trace_node_id, detachedness
      1, 1, 100, 1, 0, 0,  // Object1
      2, 2, 50, 0, 0, 0,   // String value "hello"
    ]),
    // prettier-ignore
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
    id: 2,
    name: 'hello',
    propertyValue: 'hello',
    type: 'string',
    selfSize: 50,
    edgeCount: 0
  })
})

test('should handle number property values', () => {
  const snapshot: Snapshot = {
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['id', 'name', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native', 'synthetic', 'concatenated string', 'sliced string', 'symbol', 'bigint']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column']
    },
    // prettier-ignore
    nodes: new Uint32Array([
      // id, name, self_size, edge_count, trace_node_id, detachedness
      1, 1, 100, 1, 0, 0,  // Object1
      2, 42, 50, 0, 0, 0,  // Number value 42
    ]),
    // prettier-ignore
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 1, 1,  // property edge from Object1 to number value
    ]),
    strings: ['', 'test', 'Object1'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'test')

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    id: 2,
    name: null,
    propertyValue: '42',
    type: 'number',
    selfSize: 50,
    edgeCount: 0
  })
})

test('should handle empty metadata', () => {
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
