import { test, expect } from '@jest/globals'
import { collectArrayElements } from '../src/parts/CollectArrayElements/CollectArrayElements.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'
import { createEdgeMap } from '../src/parts/CreateEdgeMap/CreateEdgeMap.ts'

test('collectArrayElements - should collect elements from a simple array', () => {
  // Create a mock snapshot with an array containing primitive elements
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 3,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // Node 0: Array object
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      0, 0, 1, 100, 2, 0, 0,  // object "Array" id=1 size=100 edges=2

      // Node 1: String element "hello"
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      3, 1, 2, 50, 0, 0, 0,   // string "hello" id=2 size=50 edges=0

      // Node 2: Number element 42
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      4, 2, 3, 24, 0, 0, 0,   // number "42" id=3 size=24 edges=0
    ]),
    edges: new Uint32Array([
      // Edge 0: Array[0] -> string "hello"
      // [type, name_or_index, to_node]
      1, 0, 7,   // element edge: index=0 -> node_1 (offset 7)

      // Edge 1: Array[1] -> number 42
      // [type, name_or_index, to_node]
      1, 1, 14,  // element edge: index=1 -> node_2 (offset 14)
    ]),
    strings: ['Array', 'hello', '42'],
    locations: new Uint32Array([]),
    meta: {
      node_types: [['object', 'native', 'code', 'string', 'number']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const edgeMap = createEdgeMap(snapshot.nodes, snapshot.meta.node_fields)
  const result = collectArrayElements(0, snapshot, edgeMap, 1)

  expect(result).toEqual(['hello', 42])
})

test('collectArrayElements - should handle empty array', () => {
  // Create a mock snapshot with an empty array
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 1,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // Node 0: Empty Array object
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      0, 0, 1, 100, 0, 0, 0,  // object "Array" id=1 size=100 edges=0
    ]),
    edges: new Uint32Array([]),
    strings: ['Array'],
    locations: new Uint32Array([]),
    meta: {
      node_types: [['object', 'native', 'code', 'string', 'number']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const edgeMap = createEdgeMap(snapshot.nodes, snapshot.meta.node_fields)
  const result = collectArrayElements(0, snapshot, edgeMap, 1)

  expect(result).toEqual([])
})

test('collectArrayElements - should limit number of elements', () => {
  // Create a mock snapshot with many array elements
  const nodeCount = 12
  const nodes = new Uint32Array(nodeCount * 7)
  const edgeCount = 10
  const edges = new Uint32Array(edgeCount * 3)
  const strings = ['Array']

  // Node 0: Array with 10 elements
  nodes.set([0, 0, 1, 100, 10, 0, 0], 0) // Array object with 10 edges

  // Nodes 1-10: String elements
  for (let i = 1; i <= 10; i++) {
    const nodeOffset = i * 7
    strings.push(`element${i}`)
    nodes.set([3, i, i + 1, 50, 0, 0, 0], nodeOffset) // String nodes
  }

  // Edges 0-9: Array elements
  for (let i = 0; i < 10; i++) {
    const edgeOffset = i * 3
    edges.set([1, i, (i + 1) * 7], edgeOffset) // Element edges pointing to string nodes
  }

  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: nodeCount,
    edge_count: edgeCount,
    extra_native_bytes: 0,
    nodes,
    edges,
    strings,
    locations: new Uint32Array([]),
    meta: {
      node_types: [['object', 'native', 'code', 'string', 'number']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const edgeMap = createEdgeMap(snapshot.nodes, snapshot.meta.node_fields)

  // Test with maxElements = 5
  const result = collectArrayElements(0, snapshot, edgeMap, 1, new Set(), 5)

  expect(result).toHaveLength(5)
  expect(result).toEqual(['element1', 'element2', 'element3', 'element4', 'element5'])
})

test('collectArrayElements - should handle nested arrays at depth > 1', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 4,
    edge_count: 3,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // Node 0: Outer Array
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      0, 0, 1, 100, 1, 0, 0,  // object "Array" id=1 size=100 edges=1

      // Node 1: Inner Array
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      0, 0, 2, 80, 2, 0, 0,   // object "Array" id=2 size=80 edges=2

      // Node 2: String "inner1"
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      3, 1, 3, 50, 0, 0, 0,   // string "inner1" id=3 size=50 edges=0

      // Node 3: String "inner2"
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      3, 2, 4, 50, 0, 0, 0,   // string "inner2" id=4 size=50 edges=0
    ]),
    edges: new Uint32Array([
      // Edge 0: Outer[0] -> Inner Array
      // [type, name_or_index, to_node]
      1, 0, 7,   // element edge: index=0 -> inner_array (offset 7)

      // Edge 1: Inner[0] -> "inner1"
      // [type, name_or_index, to_node]
      1, 0, 14,  // element edge: index=0 -> "inner1" (offset 14)

      // Edge 2: Inner[1] -> "inner2"
      // [type, name_or_index, to_node]
      1, 1, 21,  // element edge: index=1 -> "inner2" (offset 21)
    ]),
    strings: ['Array', 'inner1', 'inner2'],
    locations: new Uint32Array([]),
    meta: {
      node_types: [['object', 'native', 'code', 'string', 'number']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const edgeMap = createEdgeMap(snapshot.nodes, snapshot.meta.node_fields)

  // Test with depth = 2 to see nested array content
  const result = collectArrayElements(0, snapshot, edgeMap, 2)

  expect(result).toEqual([['inner1', 'inner2']])
})

test('collectArrayElements - should prevent circular references', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 1,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // Node 0: Array that references itself
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      0, 0, 1, 100, 1, 0, 0,  // object "Array" id=1 size=100 edges=1 (self-referencing)
    ]),
    edges: new Uint32Array([
      // Edge 0: Array[0] -> Array (circular reference)
      // [type, name_or_index, to_node]
      1, 0, 0,  // element edge: index=0 -> self (offset 0, circular!)
    ]),
    strings: ['Array'],
    locations: new Uint32Array([]),
    meta: {
      node_types: [['object', 'native', 'code', 'string', 'number']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const edgeMap = createEdgeMap(snapshot.nodes, snapshot.meta.node_fields)
  const result = collectArrayElements(0, snapshot, edgeMap, 3)

  // Should return empty array to prevent infinite recursion
  expect(result).toEqual([[]])
})
