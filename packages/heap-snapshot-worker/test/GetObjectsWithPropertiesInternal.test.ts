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
      2, 1, 21, // property edge from Object1 to property value object (array index 21 = node index 3 * 7 fields)
      2, 1, 28, // property edge from Object2 to property value object (array index 28 = node index 4 * 7 fields)
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
    edgeCount: 1,
    preview: {
      test: '[Object 4]',
    },
  })
  expect(result[1]).toEqual({
    id: 2,
    name: 'Object2',
    propertyValue: '[Object 5]',
    type: 'object',
    selfSize: 50,
    edgeCount: 1,
    preview: {
      test: '[Object 5]',
    },
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
      2, 1, 0,  // property edge from Object1 to "test" property (already 0)
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
      2, 1, 7,  // property edge from Object1 to string value (array index 7 = node index 1 * 7 fields)
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
    edgeCount: 1,
    preview: {
      test: 'hello',
    },
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
      2, 1, 7,  // property edge from Object1 to number value (array index 7 = node index 1 * 7 fields)
    ]),
    strings: ['', 'test', 'Object1', '42'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'test')

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    id: 1,
    name: 'Object1',
    propertyValue: 42,
    type: 'object',
    selfSize: 100,
    edgeCount: 1,
    preview: {
      test: 42,
    },
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

test('should handle code object with internal string reference', () => {
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
      3, 2, 1, 100, 1, 0, 0,  // Object1 with property "test"
      4, 3, 2, 0, 1, 0, 0,    // Code object with internal string reference
      2, 4, 3, 0, 0, 0, 0,    // String value "hello"
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 1, 7,  // property edge from Object1 to code object (array index 7 = node index 1 * 7 fields)
      3, 0, 14, // internal edge from code object to string "hello" (array index 14 = node index 2 * 7 fields)
    ]),
    strings: ['', 'test', 'Object1', 'CodeObject', 'hello'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'test')

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    id: 1,
    name: 'Object1',
    propertyValue: '"hello"',
    type: 'object',
    selfSize: 100,
    edgeCount: 1,
    preview: {
      test: '"hello"',
    },
  })
})

test('should handle code object with internal number reference', () => {
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
      3, 2, 1, 100, 1, 0, 0,  // Object1 with property "test"
      4, 3, 2, 0, 1, 0, 0,    // Code object with internal number reference
      7, 42, 3, 0, 0, 0, 0,   // Number value 42
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 1, 7,  // property edge from Object1 to code object (array index 7 = node index 1 * 7 fields)
      3, 0, 14, // internal edge from code object to number 42 (array index 14 = node index 2 * 7 fields)
    ]),
    strings: ['', 'test', 'Object1', 'CodeObject'],
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
    edgeCount: 1,
    preview: {
      test: '42',
    },
  })
})

test('should handle code object with internal object reference', () => {
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
      3, 2, 1, 100, 1, 0, 0,  // Object1 with property "test"
      4, 3, 2, 0, 1, 0, 0,    // Code object with internal object reference
      3, 4, 3, 50, 0, 0, 0,   // Object value
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 1, 7,  // property edge from Object1 to code object (array index 7 = node index 1 * 7 fields)
      3, 0, 14, // internal edge from code object to object (array index 14 = node index 2 * 7 fields)
    ]),
    strings: ['', 'test', 'Object1', 'CodeObject', 'InternalObject'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'test')

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    id: 1,
    name: 'Object1',
    propertyValue: '[Object 3]',
    type: 'object',
    selfSize: 100,
    edgeCount: 1,
    preview: {
      test: '[Object 3]',
    },
  })
})

test('should handle code object with internal array reference', () => {
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
      3, 2, 1, 100, 1, 0, 0,  // Object1 with property "test"
      4, 3, 2, 0, 1, 0, 0,    // Code object with internal array reference
      1, 4, 3, 50, 0, 0, 0,   // Array value
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 1, 7,  // property edge from Object1 to code object (array index 7 = node index 1 * 7 fields)
      3, 0, 14, // internal edge from code object to array (array index 14 = node index 2 * 7 fields)
    ]),
    strings: ['', 'test', 'Object1', 'CodeObject', 'InternalArray'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'test')

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    id: 1,
    name: 'Object1',
    propertyValue: '[Array 3]',
    type: 'object',
    selfSize: 100,
    edgeCount: 1,
    preview: {
      test: '[Array 3]',
    },
  })
})

test('should handle code object with incoming string reference (like the real case)', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 4,
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
      3, 2, 1, 100, 1, 0, 0,  // Object1 with property "test"
      4, 3, 2, 0, 1, 0, 0,    // Code object with internal string reference
      2, 4, 3, 0, 0, 0, 0,    // String value "hello"
      1, 5, 4, 0, 1, 0, 0,    // Array that references code object with name "1"
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 1, 7,  // property edge from Object1 to code object (array index 7 = node index 1 * 7 fields)
      3, 0, 14, // internal edge from code object to string "hello" (array index 14 = node index 2 * 7 fields)
      3, 6, 7,  // incoming edge from array to code object with name "1" (array index 7 = node index 1 * 7 fields)
    ]),
    strings: ['', 'test', 'Object1', 'CodeObject', 'hello', 'Array', '1'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'test')

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    id: 1,
    name: 'Object1',
    propertyValue: '"1"',
    type: 'object',
    selfSize: 100,
    edgeCount: 1,
    preview: {
      test: '"1"',
    },
  })
})

test('should handle code object with multiple incoming references (prioritize "1")', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 5,
    edge_count: 4,
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
      4, 3, 2, 0, 1, 0, 0,    // Code object with internal string reference
      2, 4, 3, 0, 0, 0, 0,    // String value "hello"
      1, 5, 4, 0, 2, 0, 0,    // Array that references code object with names "other" and "1"
      3, 6, 5, 0, 1, 0, 0,    // Object that references code object with name "another"
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 1, 7,  // property edge from Object1 to code object
      3, 0, 14, // internal edge from code object to string "hello"
      3, 7, 7,  // incoming edge from array to code object with name "other"
      3, 8, 7,  // incoming edge from array to code object with name "1"
      3, 9, 7,  // incoming edge from object to code object with name "another"
    ]),
    strings: ['', 'test', 'Object1', 'CodeObject', 'hello', 'Array', 'Object2', 'other', '1', 'another'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'test')

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    id: 1,
    name: 'Object1',
    propertyValue: '"1"',
    type: 'object',
    selfSize: 100,
    edgeCount: 1,
    preview: {
      test: '"1"',
    },
  })
})

test('should handle code object with no internal references but incoming references', () => {
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
      3, 2, 1, 100, 1, 0, 0,  // Object1 with property "test"
      4, 3, 2, 0, 0, 0, 0,    // Code object with no internal references
      1, 4, 3, 0, 1, 0, 0,    // Array that references code object with name "hello"
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 1, 7,  // property edge from Object1 to code object (array index 7 = node index 1 * 7 fields)
      3, 5, 7,  // incoming edge from array to code object with name "hello" (array index 7 = node index 1 * 7 fields)
    ]),
    strings: ['', 'test', 'Object1', 'CodeObject', 'Array', 'hello'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'test')

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    id: 1,
    name: 'Object1',
    propertyValue: '"hello"',
    type: 'object',
    selfSize: 100,
    edgeCount: 1,
    preview: {
      test: '"hello"',
    },
  })
})

test('should handle code object with both internal and incoming references (prioritize incoming)', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 4,
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
      3, 2, 1, 100, 1, 0, 0,  // Object1 with property "test"
      4, 3, 2, 0, 1, 0, 0,    // Code object with internal string reference
      2, 4, 3, 0, 0, 0, 0,    // String value "internal"
      1, 5, 4, 0, 1, 0, 0,    // Array that references code object with name "incoming"
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 1, 7,  // property edge from Object1 to code object (array index 7 = node index 1 * 7 fields)
      3, 0, 14, // internal edge from code object to string "internal" (array index 14 = node index 2 * 7 fields)
      3, 6, 7,  // incoming edge from array to code object with name "incoming" (array index 7 = node index 1 * 7 fields)
    ]),
    strings: ['', 'test', 'Object1', 'CodeObject', 'internal', 'Array', 'incoming'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'test')

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    id: 1,
    name: 'Object1',
    propertyValue: '"incoming"',
    type: 'object',
    selfSize: 100,
    edgeCount: 1,
    preview: {
      test: '"incoming"',
    },
  })
})

test('should handle code object with no references at all', () => {
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
      3, 2, 1, 100, 1, 0, 0,  // Object1 with property "test"
      4, 3, 2, 0, 0, 0, 0,    // Code object with no references
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 1, 7,  // property edge from Object1 to code object
    ]),
    strings: ['', 'test', 'Object1', 'CodeObject'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'test')

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    id: 1,
    name: 'Object1',
    propertyValue: '[code 2]',
    type: 'object',
    selfSize: 100,
    edgeCount: 1,
    preview: {
      test: '[code 2]',
    },
  })
})

test('should collect object properties with depth 1', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 4,
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
      3, 1, 1, 100, 3, 0, 0,  // Object with properties
      2, 2, 2, 20, 0, 0, 0,   // String property value
      7, 42, 3, 8, 0, 0, 0,   // Number property value
      3, 3, 4, 50, 0, 0, 0,   // Object property value
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 4, 7,   // property edge "oldState" to string value
      2, 5, 14,  // property edge "newState" to number value
      2, 6, 21,  // property edge "config" to object value
    ]),
    strings: ['', 'TestObject', 'hello', 'ConfigObject', 'oldState', 'newState', 'config'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'oldState', 1)

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    id: 1,
    name: 'TestObject',
    propertyValue: 'hello',
    type: 'object',
    selfSize: 100,
    edgeCount: 3,
    preview: {
      config: '[Object 4]',
      newState: 42,
      oldState: 'hello',
    },
  })
})

test('should not collect properties with depth 0', () => {
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
      3, 1, 1, 100, 1, 0, 0,  // Object with property
      2, 2, 2, 20, 0, 0, 0,   // String property value
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 3, 7,  // property edge "test" to string value
    ]),
    strings: ['', 'TestObject', 'hello', 'test'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'test', 0)

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    id: 1,
    name: 'TestObject',
    propertyValue: 'hello',
    type: 'object',
    selfSize: 100,
    edgeCount: 1,
  })
  expect(result[0].preview).toBeUndefined()
})

test('should exclude internal edges from properties collection', () => {
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
      3, 1, 1, 100, 2, 0, 0,  // Object with property and internal edge
      2, 2, 2, 20, 0, 0, 0,   // String property value
      2, 3, 3, 20, 0, 0, 0,   // Internal string value
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 4, 7,  // property edge "test" to string value
      3, 5, 14, // internal edge to internal string value
    ]),
    strings: ['', 'TestObject', 'hello', 'internal', 'test', 'internalProp'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'test', 1)

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    id: 1,
    name: 'TestObject',
    propertyValue: 'hello',
    type: 'object',
    selfSize: 100,
    edgeCount: 2,
    preview: {
      test: 'hello',
    },
  })

  // Should not include the internal edge in preview
  expect(result[0].preview?.internalProp).toBeUndefined()
})

test('should collect nested properties with depth 2', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 6,
    edge_count: 5,
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
      3, 1, 1, 100, 2, 0, 0,  // Main object with oldState property
      3, 2, 2, 50, 2, 0, 0,   // oldState object with filteredItems and items
      2, 3, 3, 20, 0, 0, 0,   // filteredItems string value
      2, 4, 4, 20, 0, 0, 0,   // items string value
      3, 5, 5, 30, 1, 0, 0,   // newState object with preferences
      2, 6, 6, 15, 0, 0, 0,   // preferences string value
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 7, 7,   // property edge "oldState" from main to oldState object
      2, 8, 28,  // property edge "newState" from main to newState object
      2, 9, 14,  // property edge "filteredItems" from oldState to string
      2, 10, 21, // property edge "items" from oldState to string
      2, 11, 35, // property edge "preferences" from newState to string
    ]),
    strings: ['', 'MainObject', 'OldStateObject', 'array1', 'array2', 'NewStateObject', 'settings', 'oldState', 'newState', 'filteredItems', 'items', 'preferences'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'oldState', 2)

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    id: 1,
    name: 'MainObject',
    propertyValue: '[Object 2]',
    type: 'object',
    selfSize: 100,
    edgeCount: 2,
    preview: {
      oldState: {
        filteredItems: 'array1',
        items: 'array2',
      },
      newState: {
        preferences: 'settings',
      },
    },
  })
})

test('should detect boolean values from hidden nodes with boolean-like property names', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 4,
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
      3, 1, 1, 100, 2, 0, 0,  // Object with boolean properties
      0, 0, 75, 0, 0, 0, 0,   // hidden node (boolean true)
      0, 0, 77, 0, 0, 0, 0,   // hidden node (boolean false)
      3, 4, 2, 50, 1, 0, 0,   // Another object with boolean property
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 2, 7,   // property edge "isExpanded" to hidden node 75 (true)
      2, 3, 14,  // property edge "isVisible" to hidden node 77 (false)
      2, 2, 7,   // property edge "isExpanded" to hidden node 75 (true) from second object
    ]),
    strings: ['', 'TestObject1', 'isExpanded', 'isVisible', 'TestObject2'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'isExpanded', 1)

  expect(result).toHaveLength(2)

  // Both objects should have isExpanded property detected as boolean true
  expect(result[0]).toEqual({
    id: 1,
    name: 'TestObject1',
    propertyValue: true,
    type: 'object',
    selfSize: 100,
    edgeCount: 2,
    preview: {
      isExpanded: true,
      isVisible: false,
    },
  })

  expect(result[1]).toEqual({
    id: 2,
    name: 'TestObject2',
    propertyValue: true,
    type: 'object',
    selfSize: 50,
    edgeCount: 1,
    preview: {
      isExpanded: true,
    },
  })
})

test('should detect boolean false values from hidden nodes', () => {
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
      3, 1, 1, 100, 2, 0, 0,  // Object with boolean properties
      0, 0, 75, 0, 0, 0, 0,   // hidden node (boolean true)
      0, 0, 77, 0, 0, 0, 0,   // hidden node (boolean false)
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 2, 7,   // property edge "isExpanded" to hidden node 75 (true)
      2, 3, 14,  // property edge "isCollapsed" to hidden node 77 (false)
    ]),
    strings: ['', 'TestObject', 'isExpanded', 'isCollapsed'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'isCollapsed', 2)

  expect(result).toHaveLength(1)

  // Should have both boolean properties in preview at depth 2
  expect(result[0]).toEqual({
    id: 1,
    name: 'TestObject',
    propertyValue: false,
    type: 'object',
    selfSize: 100,
    edgeCount: 2,
    preview: {
      isExpanded: true,
      isCollapsed: false,
    },
  })
})

test('should handle explicit boolean node names', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 3,
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
      3, 1, 1, 100, 1, 0, 0,  // Object
      0, 2, 99, 0, 0, 0, 0,   // hidden node with name "true"
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 3, 7,   // property edge "enabled" to hidden node with name "true"
    ]),
    strings: ['', 'TestObject', 'true', 'enabled'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'enabled', 1)

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    id: 1,
    name: 'TestObject',
    propertyValue: true,
    type: 'object',
    selfSize: 100,
    edgeCount: 1,
    preview: {
      enabled: true,
    },
  })
})

test('should show array contents in property preview at depth > 1', () => {
  // Create a snapshot where an object has a property "filteredItems" that points to an array
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 5,
    edge_count: 4,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // Node 0: Object with property "filteredItems"
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      3, 0, 1, 100, 1, 0, 0,   // object "BenchmarkObject" id=1 size=100 edges=1

      // Node 1: Array object
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      3, 1, 2, 80, 1, 0, 0,    // object "Array" id=2 size=80 edges=1

      // Node 2: First array element (object)
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      3, 3, 3, 50, 2, 0, 0,    // object "Object" id=3 size=50 edges=2

      // Node 3: String "editor.fontsize"
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      2, 4, 4, 30, 0, 0, 0,    // string "editor.fontsize" id=4 size=30 edges=0

      // Node 4: String "the fontsize of the editor"
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      2, 5, 5, 40, 0, 0, 0,    // string "the fontsize of the editor" id=5 size=40 edges=0
    ]),
    edges: new Uint32Array([
      // Edge 0: BenchmarkObject["filteredItems"] -> Array
      // [type, name_or_index, to_node]
      2, 2, 7,   // property "filteredItems" -> Array (offset 7)

      // Edge 1: Array[0] -> Object
      // [type, name_or_index, to_node]
      1, 0, 14,  // element index=0 -> Object (offset 14)

      // Edge 2: Object["id"] -> String "editor.fontsize"
      // [type, name_or_index, to_node]
      2, 6, 21,  // property "id" -> "editor.fontsize" (offset 21)

      // Edge 3: Object["description"] -> String "the fontsize of the editor"
      // [type, name_or_index, to_node]
      2, 7, 28,  // property "description" -> "the fontsize of the editor" (offset 28)
    ]),
    strings: [
      'BenchmarkObject', // 0
      'Array', // 1
      'filteredItems', // 2
      'Object', // 3
      'editor.fontsize', // 4
      'the fontsize of the editor', // 5
      'id', // 6
      'description', // 7
    ],
    locations: new Uint32Array([]),
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  // Test with depth=3 to see array contents and object properties inside
  const result = getObjectsWithPropertiesInternal(snapshot, 'filteredItems', 3)

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    id: 1,
    name: 'BenchmarkObject',
    propertyValue: '[Object 2]',
    type: 'object',
    selfSize: 100,
    edgeCount: 1,
    preview: {
      filteredItems: [
        {
          id: 'editor.fontsize',
          description: 'the fontsize of the editor',
        },
      ],
    },
  })
})

test('should show simple array contents with primitive values', () => {
  // Create a snapshot where an object has a property that points to an array of strings
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 4,
    edge_count: 3,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // Node 0: Object with property "items"
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      3, 0, 1, 100, 1, 0, 0,   // object "TestObject" id=1 size=100 edges=1

      // Node 1: Array object
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      3, 1, 2, 80, 2, 0, 0,    // object "Array" id=2 size=80 edges=2

      // Node 2: String "hello"
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      2, 3, 3, 30, 0, 0, 0,    // string "hello" id=3 size=30 edges=0

      // Node 3: String "world"
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      2, 4, 4, 30, 0, 0, 0,    // string "world" id=4 size=30 edges=0
    ]),
    edges: new Uint32Array([
      // Edge 0: TestObject["items"] -> Array
      // [type, name_or_index, to_node]
      2, 2, 7,   // property "items" -> Array (offset 7)

      // Edge 1: Array[0] -> String "hello"
      // [type, name_or_index, to_node]
      1, 0, 14,  // element index=0 -> "hello" (offset 14)

      // Edge 2: Array[1] -> String "world"
      // [type, name_or_index, to_node]
      1, 1, 21,  // element index=1 -> "world" (offset 21)
    ]),
    strings: [
      'TestObject', // 0
      'Array', // 1
      'items', // 2
      'hello', // 3
      'world', // 4
    ],
    locations: new Uint32Array([]),
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  // Test with depth=2 to see array contents
  const result = getObjectsWithPropertiesInternal(snapshot, 'items', 2)

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    id: 1,
    name: 'TestObject',
    propertyValue: '[Object 2]',
    type: 'object',
    selfSize: 100,
    edgeCount: 1,
    preview: {
      items: ['hello', 'world'],
    },
  })
})
