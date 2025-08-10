import { test, expect } from '@jest/globals'
import { createEdgeMap } from '../src/parts/CreateEdgeMap/CreateEdgeMap.ts'
import { getNumberValue } from '../src/parts/GetNumberValue/GetNumberValue.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('getNumberValue - should handle SMI numbers correctly', () => {
  const strings = ['42', '3.14', '123']

  const snapshot: Snapshot = {
    node_count: 3,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // Number node with direct value "42"
      0,
      0,
      1,
      8,
      0, // type=0 (number), name=0 ("42"), id=1, size=8, edges=0
      // Number node with direct value "3.14"
      0,
      1,
      2,
      8,
      0, // type=0 (number), name=1 ("3.14"), id=2, size=8, edges=0
      // Number node with direct value "123"
      0,
      2,
      3,
      8,
      0, // type=0 (number), name=2 ("123"), id=3, size=8, edges=0
    ]),
    edges: new Uint32Array([]),
    strings,
    locations: new Uint32Array([]),
    meta: {
      node_types: [['number']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      edge_types: [['internal', 'property']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const edgeMap = createEdgeMap(snapshot.nodes, snapshot.meta.node_fields)

  // Test SMI number (direct value)
  const smiNode = { type: 0, name: 0, id: 1 }
  expect(getNumberValue(smiNode, snapshot, edgeMap)).toBe(42)

  // Test decimal number
  const decimalNode = { type: 0, name: 1, id: 2 }
  expect(getNumberValue(decimalNode, snapshot, edgeMap)).toBe(3.14)

  // Test integer
  const intNode = { type: 0, name: 2, id: 3 }
  expect(getNumberValue(intNode, snapshot, edgeMap)).toBe(123)
})

test('getNumberValue - should handle heap numbers with internal edges', () => {
  const strings = ['(heap number)', 'internal', '42', '3.14']

  const snapshot: Snapshot = {
    node_count: 4,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // Heap number node with 2 edges
      0,
      0,
      1,
      8,
      2, // type=0 (number), name=0 ("(heap number)"), id=1, size=8, edges=2
      // String node with actual value "42"
      1,
      2,
      2,
      10,
      0, // type=1 (string), name=2 ("42"), id=2, size=10, edges=0
      // String node with actual value "3.14"
      1,
      3,
      3,
      10,
      0, // type=1 (string), name=3 ("3.14"), id=3, size=10, edges=0
      // Object node
      2,
      0,
      4,
      32,
      0, // type=2 (object), name=0, id=4, size=32, edges=0
    ]),
    edges: new Uint32Array([
      // Internal edge from heap number to string "42"
      0,
      1,
      5, // type=0 (internal), name=1 ("internal"), toNode=5 (string node)
      // Internal edge from heap number to string "3.14"
      0,
      1,
      10, // type=0 (internal), name=1 ("internal"), toNode=10 (string node)
    ]),
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

  // Test heap number that references a string value
  const heapNumberNode = { type: 0, name: 0, id: 1 }
  expect(getNumberValue(heapNumberNode, snapshot, edgeMap)).toBe(42)
})

test('getNumberValue - should handle heap numbers with property edges', () => {
  const strings = ['(heap number)', 'value', '42', 'property']

  const snapshot: Snapshot = {
    node_count: 3,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // Heap number node with 1 edge
      0,
      0,
      1,
      8,
      1, // type=0 (number), name=0 ("(heap number)"), id=1, size=8, edges=1
      // String node with actual value "42"
      1,
      2,
      2,
      10,
      0, // type=1 (string), name=2 ("42"), id=2, size=10, edges=0
      // Object node
      2,
      0,
      3,
      32,
      0, // type=2 (object), name=0, id=3, size=32, edges=0
    ]),
    edges: new Uint32Array([
      // Property edge from heap number to string "42"
      1,
      1,
      5, // type=1 (property), name=1 ("value"), toNode=5 (string node)
    ]),
    strings,
    locations: new Uint32Array([]),
    meta: {
      node_types: [['number', 'string', 'object']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      edge_types: [['internal', 'property', 'element']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const edgeMap = createEdgeMap(snapshot.nodes, snapshot.meta.node_fields)

  // Test heap number that references a string value through property edge
  const heapNumberNode = { type: 0, name: 0, id: 1 }
  expect(getNumberValue(heapNumberNode, snapshot, edgeMap)).toBe(42)
})

test('getNumberValue - should handle edge names that are numbers', () => {
  const strings = ['(heap number)', '42', '123']

  const snapshot: Snapshot = {
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // Heap number node with 1 edge
      0,
      0,
      1,
      8,
      1, // type=0 (number), name=0 ("(heap number)"), id=1, size=8, edges=1
      // Object node
      1,
      0,
      2,
      32,
      0, // type=1 (object), name=0, id=2, size=32, edges=0
    ]),
    edges: new Uint32Array([
      // Edge with numeric name "42"
      0,
      1,
      5, // type=0 (internal), name=1 ("42"), toNode=5 (object node)
    ]),
    strings,
    locations: new Uint32Array([]),
    meta: {
      node_types: [['number', 'object']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      edge_types: [['internal', 'property']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const edgeMap = createEdgeMap(snapshot.nodes, snapshot.meta.node_fields)

  // Test heap number with edge name that is a number
  const heapNumberNode = { type: 0, name: 0, id: 1 }
  expect(getNumberValue(heapNumberNode, snapshot, edgeMap)).toBe(42)
})

test('getNumberValue - should handle non-number nodes', () => {
  const strings = ['string', 'object']

  const snapshot: Snapshot = {
    node_count: 2,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // String node
      0,
      0,
      1,
      10,
      0, // type=0 (string), name=0 ("string"), id=1, size=10, edges=0
      // Object node
      1,
      1,
      2,
      32,
      0, // type=1 (object), name=1 ("object"), id=2, size=32, edges=0
    ]),
    edges: new Uint32Array([]),
    strings,
    locations: new Uint32Array([]),
    meta: {
      node_types: [['string', 'object']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      edge_types: [['internal', 'property']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const edgeMap = createEdgeMap(snapshot.nodes, snapshot.meta.node_fields)

  // Test string node (should return null)
  const stringNode = { type: 0, name: 0, id: 1 }
  expect(getNumberValue(stringNode, snapshot, edgeMap)).toBeNull()

  // Test object node (should return null)
  const objectNode = { type: 1, name: 1, id: 2 }
  expect(getNumberValue(objectNode, snapshot, edgeMap)).toBeNull()
})

test('getNumberValue - should handle circular references', () => {
  const strings = ['(heap number)', 'circular']

  const snapshot: Snapshot = {
    node_count: 1,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // Number node
      0,
      0,
      1,
      8,
      0, // type=0 (number), name=0 ("(heap number)"), id=1, size=8, edges=0
    ]),
    edges: new Uint32Array([]),
    strings,
    locations: new Uint32Array([]),
    meta: {
      node_types: [['number']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      edge_types: [['internal', 'property']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const edgeMap = createEdgeMap(snapshot.nodes, snapshot.meta.node_fields)

  // Test circular reference
  const numberNode = { type: 0, name: 0, id: 1 }
  const visited = new Set([1]) // Mark as already visited

  expect(getNumberValue(numberNode, snapshot, edgeMap, visited)).toBeNull()
})

test('getNumberValue - should handle null/undefined nodes', () => {
  const strings = ['(heap number)']

  const snapshot: Snapshot = {
    node_count: 1,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // Number node
      0, 0, 1, 8, 0, // type=0 (number), name=0 ("(heap number)"), id=1, size=8, edges=0
    ]),
    edges: new Uint32Array([]),
    strings,
    locations: new Uint32Array([]),
    meta: {
      node_types: [['number']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      edge_types: [['internal', 'property']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const edgeMap = createEdgeMap(snapshot.nodes, snapshot.meta.node_fields)

  // Test null node
  expect(getNumberValue(null, snapshot, edgeMap)).toBeNull()

  // Test undefined node
  expect(getNumberValue(undefined, snapshot, edgeMap)).toBeNull()
})

test('getNumberValue - should handle smi number nodes with value edges', () => {
  const strings = ['smi number', 'value', '200', '300']

  const snapshot: Snapshot = {
    node_count: 3,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // SMI number node with 1 edge
      0, 0, 1, 8, 1, // type=0 (number), name=0 ("smi number"), id=1, size=8, edges=1
      // String node with actual value "200"
      1, 2, 2, 10, 0, // type=1 (string), name=2 ("200"), id=2, size=10, edges=0
      // String node with actual value "300"
      1, 3, 3, 10, 0, // type=1 (string), name=3 ("300"), id=3, size=10, edges=0
    ]),
    edges: new Uint32Array([
      // Edge from smi number to string "200" with name "value"
      // type=0 (internal), name=1 ("value"), toNode=5 (string node "200" at index 1)
      0, 1, 5,
    ]),
    strings,
    locations: new Uint32Array([]),
    meta: {
      node_types: [['number', 'string']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      edge_types: [['internal', 'property']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const edgeMap = createEdgeMap(snapshot.nodes, snapshot.meta.node_fields)

  // Test SMI number node with internal edge named "value" pointing to string "200"
  const smiNumberNode = { type: 0, name: 0, id: 1 }
  expect(getNumberValue(smiNumberNode, snapshot, edgeMap)).toBe(200)
})
