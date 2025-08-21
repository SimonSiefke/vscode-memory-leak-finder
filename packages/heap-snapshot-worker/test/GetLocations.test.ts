import { test, expect } from '@jest/globals'
import { getLocations } from '../src/parts/GetLocations/GetLocations.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.js'

test('should extract locations for given indices', () => {
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
      0, 1, 10, 5,  // object_index=0, script_id=1, line=10, column=5
      1, 2, 15, 8,  // object_index=1, script_id=2, line=15, column=8
      2, 3, 20, 12, // object_index=2, script_id=3, line=20, column=12
    ]),
  }

  const indices = [0, 2] // Get locations for objects 0 and 2
  const locationIndices = new Uint32Array([0, 2]) // Location indices in the locations array

  const result = getLocations(snapshot, indices, locationIndices)

  expect(result).toEqual(new Uint32Array([
    1, 10, 5,  // script_id=1, line=10, column=5 for object 0
    3, 20, 12, // script_id=3, line=20, column=12 for object 2
  ]))
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
    locations: new Uint32Array([0, 5, 25, 10]), // object_index=0, script_id=5, line=25, column=10
  }

  const indices = [0]
  const locationIndices = new Uint32Array([0])

  const result = getLocations(snapshot, indices, locationIndices)

  expect(result).toEqual(new Uint32Array([5, 25, 10])) // script_id=5, line=25, column=10
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
  const locationIndices = new Uint32Array([])

  const result = getLocations(snapshot, indices, locationIndices)

  expect(result).toEqual(new Uint32Array([]))
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
    locations: new Uint32Array([5, 25, 10, 0]), // script_id=5, line=25, column=10, object_index=0
  }

  const indices = [0]
  const locationIndices = new Uint32Array([0])

  const result = getLocations(snapshot, indices, locationIndices)

  expect(result).toEqual(new Uint32Array([5, 25, 10])) // script_id=5, line=25, column=10
})

test('should handle zero values', () => {
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
    locations: new Uint32Array([0, 0, 0, 0]), // All zeros
  }

  const indices = [0]
  const locationIndices = new Uint32Array([0])

  const result = getLocations(snapshot, indices, locationIndices)

  expect(result).toEqual(new Uint32Array([0, 0, 0])) // All zeros
})

test('should handle large values', () => {
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
    locations: new Uint32Array([0, 9999, 8888, 7777]), // Large values
  }

  const indices = [0]
  const locationIndices = new Uint32Array([0])

  const result = getLocations(snapshot, indices, locationIndices)

  expect(result).toEqual(new Uint32Array([9999, 8888, 7777])) // Large values preserved
})

test('should handle multiple indices in sequence', () => {
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
      0, 1, 10, 5,  // object_index=0, script_id=1, line=10, column=5
      1, 2, 15, 8,  // object_index=1, script_id=2, line=15, column=8
      2, 3, 20, 12, // object_index=2, script_id=3, line=20, column=12
    ]),
  }

  const indices = [0, 1, 2] // Get locations for all objects
  const locationIndices = new Uint32Array([0, 1, 2])

  const result = getLocations(snapshot, indices, locationIndices)

  expect(result).toEqual(new Uint32Array([
    1, 10, 5,  // script_id=1, line=10, column=5 for object 0
    2, 15, 8,  // script_id=2, line=15, column=8 for object 1
    3, 20, 12, // script_id=3, line=20, column=12 for object 2
  ]))
})
