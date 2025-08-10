import { test, expect } from '@jest/globals'
import { createEdgeMap } from '../src/parts/CreateEdgeMap/CreateEdgeMap.ts'
import { getActualValue } from '../src/parts/GetActualValue/GetActualValue.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('getActualValue - should handle string nodes correctly', () => {
  const strings = ['', 'hello', 'world', 'test value']

  const snapshot: Snapshot = {
    node_count: 0,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([]),
    edges: new Uint32Array([]),
    strings,
    locations: new Uint32Array([]),
    meta: {
      node_types: [['string', 'object']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      edge_types: [['property']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const edgeMap = createEdgeMap(snapshot.nodes, snapshot.meta.node_fields)

  // Test empty string
  const emptyStringNode = { type: 0, name: 0, id: 1 }
  expect(getActualValue(emptyStringNode, snapshot, edgeMap)).toBe('')

  // Test regular string
  const helloNode = { type: 0, name: 1, id: 2 }
  expect(getActualValue(helloNode, snapshot, edgeMap)).toBe('hello')

  // Test string with spaces
  const testValueNode = { type: 0, name: 3, id: 3 }
  expect(getActualValue(testValueNode, snapshot, edgeMap)).toBe('test value')
})

test('getActualValue - should handle number nodes correctly', () => {
  const strings = ['42', '3.14', '(heap number)', '123']

  const snapshot: Snapshot = {
    node_count: 0,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([]),
    edges: new Uint32Array([]),
    strings,
    locations: new Uint32Array([]),
    meta: {
      node_types: [['number', 'string', 'object']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      edge_types: [['internal', 'property']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const edgeMap = createEdgeMap(snapshot.nodes, snapshot.meta.node_fields)

  // Test SMI number (direct value)
  const smiNode = { type: 0, name: 0, id: 1 }
  expect(getActualValue(smiNode, snapshot, edgeMap)).toBe('42')

  // Test decimal number
  const decimalNode = { type: 0, name: 1, id: 2 }
  expect(getActualValue(decimalNode, snapshot, edgeMap)).toBe('3.14')

  // Test heap number (should return the actual value from edges)
  const heapNumberNode = { type: 0, name: 2, id: 3 }
  expect(getActualValue(heapNumberNode, snapshot, edgeMap)).toBe('[Number 3]')
})

test('getActualValue - should handle boolean values correctly', () => {
  const strings = ['true', 'false', 'hidden']

  const snapshot: Snapshot = {
    node_count: 0,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([]),
    edges: new Uint32Array([]),
    strings,
    locations: new Uint32Array([]),
    meta: {
      node_types: [['hidden', 'object']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      edge_types: [['internal', 'property']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const edgeMap = createEdgeMap(snapshot.nodes, snapshot.meta.node_fields)

  // Test boolean true
  const trueNode = { type: 0, name: 0, id: 1 }
  expect(getActualValue(trueNode, snapshot, edgeMap)).toBe('true')

  // Test boolean false
  const falseNode = { type: 0, name: 1, id: 2 }
  expect(getActualValue(falseNode, snapshot, edgeMap)).toBe('false')
})

test('getActualValue - should handle undefined values correctly', () => {
  const strings = ['undefined', 'hidden']

  const snapshot: Snapshot = {
    node_count: 0,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([]),
    edges: new Uint32Array([]),
    strings,
    locations: new Uint32Array([]),
    meta: {
      node_types: [['hidden', 'object']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      edge_types: [['internal', 'property']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const edgeMap = createEdgeMap(snapshot.nodes, snapshot.meta.node_fields)

  // Test undefined value
  const undefinedNode = { type: 0, name: 0, id: 1 }
  expect(getActualValue(undefinedNode, snapshot, edgeMap)).toBe('[undefined 1]')
})

test('getActualValue - should handle code objects correctly', () => {
  const strings = ['code', 'internal', 'actualValue', '42']

  // Create a snapshot with a code object that has internal edges to string/number values
  const snapshot: Snapshot = {
    node_count: 2,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // Code node with 2 edges
      0,
      0,
      1,
      100,
      2, // type=0 (code), name=0 ("code"), id=1, size=100, edges=2
      // String node with actual value
      1,
      3,
      2,
      10,
      0, // type=1 (string), name=3 ("42"), id=2, size=10, edges=0
    ]),
    edges: new Uint32Array([
      // Internal edge from code to string
      0,
      1,
      5, // type=0 (internal), name=1 ("internal"), toNode=5 (string node)
    ]),
    strings,
    locations: new Uint32Array([]),
    meta: {
      node_types: [['code', 'string']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      edge_types: [['internal', 'property']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const edgeMap = createEdgeMap(snapshot.nodes, snapshot.meta.node_fields)

  // Test code object that references a string value
  const codeNode = { type: 0, name: 0, id: 1 }
  expect(getActualValue(codeNode, snapshot, edgeMap)).toBe('42')
})

test('getActualValue - should handle circular references', () => {
  const strings = ['object', 'circular']

  const snapshot: Snapshot = {
    node_count: 0,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([]),
    edges: new Uint32Array([]),
    strings,
    locations: new Uint32Array([]),
    meta: {
      node_types: [['object']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      edge_types: [['property']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const edgeMap = createEdgeMap(snapshot.nodes, snapshot.meta.node_fields)

  // Test circular reference
  const circularNode = { type: 0, name: 0, id: 1 }
  const visited = new Set([1]) // Mark as already visited

  expect(getActualValue(circularNode, snapshot, edgeMap, visited)).toBe('[Circular 1]')
})

test('getActualValue - should handle null/undefined nodes', () => {
  const strings = ['object']

  const snapshot: Snapshot = {
    node_count: 0,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([]),
    edges: new Uint32Array([]),
    strings,
    locations: new Uint32Array([]),
    meta: {
      node_types: [['object']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      edge_types: [['property']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const edgeMap = createEdgeMap(snapshot.nodes, snapshot.meta.node_fields)

  // Test null node
  expect(getActualValue(null, snapshot, edgeMap)).toBe('[Circular Unknown]')

  // Test undefined node
  expect(getActualValue(undefined, snapshot, edgeMap)).toBe('[Circular Unknown]')
})

test('getActualValue - should handle unknown node types', () => {
  const strings = ['unknown', 'custom']

  const snapshot: Snapshot = {
    node_count: 0,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([]),
    edges: new Uint32Array([]),
    strings,
    locations: new Uint32Array([]),
    meta: {
      node_types: [['unknown', 'custom']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      edge_types: [['property']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const edgeMap = createEdgeMap(snapshot.nodes, snapshot.meta.node_fields)

  // Test unknown node type
  const unknownNode = { type: 0, name: 0, id: 1 }
  expect(getActualValue(unknownNode, snapshot, edgeMap)).toBe('[unknown 1]')

  // Test custom node type
  const customNode = { type: 1, name: 1, id: 2 }
  expect(getActualValue(customNode, snapshot, edgeMap)).toBe('[custom 2]')
})

test('getActualValue - should handle complex nested structures', () => {
  const strings = ['code', 'internal', 'nested', 'deepValue', '123']

  // Create a snapshot with nested code objects
  const snapshot: Snapshot = {
    node_count: 3,
    edge_count: 3,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // Code node with 2 edges
      0,
      0,
      1,
      100,
      2, // type=0 (code), name=0 ("code"), id=1, size=100, edges=2
      // Another code node
      0,
      2,
      2,
      50,
      1, // type=0 (code), name=2 ("nested"), id=2, size=50, edges=1
      // String node with actual value
      1,
      4,
      3,
      10,
      0, // type=1 (string), name=4 ("123"), id=3, size=10, edges=0
    ]),
    edges: new Uint32Array([
      // Internal edge from first code to second code
      0,
      1,
      5, // type=0 (internal), name=1 ("internal"), toNode=5 (second code)
      // Internal edge from second code to string
      0,
      1,
      10, // type=0 (internal), name=1 ("internal"), toNode=10 (string)
    ]),
    strings,
    locations: new Uint32Array([]),
    meta: {
      node_types: [['code', 'string']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      edge_types: [['internal', 'property']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const edgeMap = createEdgeMap(snapshot.nodes, snapshot.meta.node_fields)

  // Test code object that references another code object that references a string value
  const codeNode = { type: 0, name: 0, id: 1 }
  expect(getActualValue(codeNode, snapshot, edgeMap)).toBe('123')
})
