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
  })
  expect(result[1]).toEqual({
    id: 2,
    name: 'Object2',
    propertyValue: '[Object 5]',
    type: 'object',
    selfSize: 50,
    edgeCount: 1,
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
    propertyValue: '42',
    type: 'object',
    selfSize: 100,
    edgeCount: 1,
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
      2, 1, 1,  // property edge from Object1 to code object
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
    propertyValue: '[Object 1]',
    type: 'object',
    selfSize: 100,
    edgeCount: 1,
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
      2, 1, 1,  // property edge from Object1 to code object
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
    propertyValue: '[Object 1]',
    type: 'object',
    selfSize: 100,
    edgeCount: 1,
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
      2, 1, 1,  // property edge from Object1 to code object
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
    propertyValue: '[Object 1]',
    type: 'object',
    selfSize: 100,
    edgeCount: 1,
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
      2, 1, 1,  // property edge from Object1 to code object
      3, 0, 2,  // internal edge from code object to string "hello"
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
      2, 1, 1,  // property edge from Object1 to code object
      3, 0, 2,  // internal edge from code object to string "hello"
      3, 7, 1,  // incoming edge from array to code object with name "other"
      3, 8, 1,  // incoming edge from array to code object with name "1"
      3, 9, 1,  // incoming edge from object to code object with name "another"
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
      2, 1, 1,  // property edge from Object1 to code object
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
      2, 1, 1,  // property edge from Object1 to code object
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
    propertyValue: '[Object 1]',
    type: 'object',
    selfSize: 100,
    edgeCount: 1,
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
      2, 1, 1,  // property edge from Object1 to code object
    ]),
    strings: ['', 'test', 'Object1', 'CodeObject'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'test')

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    id: 1,
    name: 'Object1',
    propertyValue: '[Object 1]',
    type: 'object',
    selfSize: 100,
    edgeCount: 1,
  })
})
