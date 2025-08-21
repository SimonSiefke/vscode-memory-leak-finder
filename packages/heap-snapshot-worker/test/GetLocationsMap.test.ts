import { test, expect } from '@jest/globals'
import { getLocationsMap } from '../src/parts/GetLocationsMap/GetLocationsMap.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.js'

test('should create location map for valid snapshot', () => {
  const snapshot: Snapshot = {
    node_count: 3,
    edge_count: 0,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      node_types: [['object', 'string', 'number']],
      edge_fields: [],
      edge_types: [[]],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    nodes: new Uint32Array([0, 0, 1, 100, 0, 0, 0, 2, 50, 0, 0, 0, 3, 75, 0]),
    edges: new Uint32Array([]),
    strings: ['', 'Object1', 'Object2', 'Object3'],
    locations: new Uint32Array([
      0,
      1,
      10,
      5, // object_index=0, script_id=1, line=10, column=5
      1,
      2,
      15,
      8, // object_index=1, script_id=2, line=15, column=8
      2,
      3,
      20,
      12, // object_index=2, script_id=3, line=20, column=12
    ]),
  }

  const indices = [0, 1, 2]

  const result = getLocationsMap(snapshot, indices)

  // Implementation returns byte offsets into locations array
  expect(result).toEqual(new Uint32Array([0, 4, 8]))
})

test('should handle empty indices array', () => {
  const snapshot: Snapshot = {
    node_count: 1,
    edge_count: 0,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      node_types: [['object']],
      edge_fields: [],
      edge_types: [[]],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    nodes: new Uint32Array([0, 0, 1, 100, 0]),
    edges: new Uint32Array([]),
    strings: ['', 'Object1'],
    locations: new Uint32Array([0, 1, 10, 5]),
  }

  const indices: number[] = []

  const result = getLocationsMap(snapshot, indices)

  expect(result).toEqual(new Uint32Array([]))
})

test('should handle single index', () => {
  const snapshot: Snapshot = {
    node_count: 1,
    edge_count: 0,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      node_types: [['object']],
      edge_fields: [],
      edge_types: [[]],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    nodes: new Uint32Array([0, 0, 1, 100, 0]),
    edges: new Uint32Array([]),
    strings: ['', 'Object1'],
    locations: new Uint32Array([0, 1, 10, 5]),
  }

  const indices = [0]

  const result = getLocationsMap(snapshot, indices)

  expect(result).toEqual(new Uint32Array([0]))
})

test('should handle different field order', () => {
  const snapshot: Snapshot = {
    node_count: 1,
    edge_count: 0,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      node_types: [['object']],
      edge_fields: [],
      edge_types: [[]],
      location_fields: ['script_id', 'line', 'column', 'object_index'], // Different order
    },
    nodes: new Uint32Array([0, 0, 1, 100, 0]),
    edges: new Uint32Array([]),
    strings: ['', 'Object1'],
    locations: new Uint32Array([1, 10, 5, 0]), // script_id=1, line=10, column=5, object_index=0
  }

  const indices = [0]

  const result = getLocationsMap(snapshot, indices)

  expect(result).toEqual(new Uint32Array([0]))
})

test('should handle large node count', () => {
  const nodeCount = 100
  const nodeFieldCount = 5
  const locationFieldCount = 4

  const nodes = new Uint32Array(nodeCount * nodeFieldCount)
  const locations = new Uint32Array(nodeCount * locationFieldCount)

  // Fill with test data
  for (let i = 0; i < nodeCount; i++) {
    const nodeOffset = i * nodeFieldCount
    nodes[nodeOffset] = 0 // type
    nodes[nodeOffset + 1] = 0 // name
    nodes[nodeOffset + 2] = i + 1 // id
    nodes[nodeOffset + 3] = 100 // self_size
    nodes[nodeOffset + 4] = 0 // edge_count

    const locOffset = i * locationFieldCount
    locations[locOffset] = i // object_index
    locations[locOffset + 1] = i + 1 // script_id
    locations[locOffset + 2] = i + 10 // line
    locations[locOffset + 3] = i + 20 // column
  }

  const snapshot: Snapshot = {
    node_count: nodeCount,
    edge_count: 0,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      node_types: [['object']],
      edge_fields: [],
      edge_types: [[]],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    nodes,
    edges: new Uint32Array([]),
    strings: ['', 'Object'],
    locations,
  }

  const indices = [0, 50, 99] // Test with specific indices

  const result = getLocationsMap(snapshot, indices)

  // Expect offsets into the flat locations array
  expect(result).toEqual(new Uint32Array([0, 200, 396]))
})

test('should throw error when index field not found', () => {
  const snapshot: Snapshot = {
    node_count: 1,
    edge_count: 0,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      node_types: [['object']],
      edge_fields: [],
      edge_types: [[]],
      location_fields: ['script_id', 'line', 'column'], // Missing object_index
    },
    nodes: new Uint32Array([0, 0, 1, 100, 0]),
    edges: new Uint32Array([]),
    strings: ['', 'Object1'],
    locations: new Uint32Array([1, 10, 5]),
  }

  const indices = [0]

  expect(() => getLocationsMap(snapshot, indices)).toThrow('index not found')
})

test('should handle sparse object indices', () => {
  const snapshot: Snapshot = {
    node_count: 5,
    edge_count: 0,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      node_types: [['object']],
      edge_fields: [],
      edge_types: [[]],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    nodes: new Uint32Array([0, 0, 1, 100, 0, 0, 0, 2, 50, 0, 0, 0, 3, 75, 0, 0, 0, 4, 25, 0, 0, 0, 5, 125, 0]),
    edges: new Uint32Array([]),
    strings: ['', 'Object1', 'Object2', 'Object3', 'Object4', 'Object5'],
    locations: new Uint32Array([
      0,
      1,
      10,
      5, // object_index=0, script_id=1, line=10, column=5
      2,
      2,
      15,
      8, // object_index=2, script_id=2, line=15, column=8
      4,
      3,
      20,
      12, // object_index=4, script_id=3, line=20, column=12
    ]),
  }

  const indices = [0, 2, 4]

  const result = getLocationsMap(snapshot, indices)

  // Expect offsets reflecting sparse object indices
  expect(result).toEqual(new Uint32Array([0, 4, 8]))
})
