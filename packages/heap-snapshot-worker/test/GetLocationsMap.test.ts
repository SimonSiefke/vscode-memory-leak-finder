/* prettier-ignore */
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
    nodes: new Uint32Array(
      // prettier-ignore
      [
        // type  name  id  self_size  edge_count
        0,     0,    1,  100,       0,
        0,     0,    2,   50,       0,
        0,     0,    3,   75,       0,
      ],
    ),
    edges: new Uint32Array([]),
    strings: ['', 'Object1', 'Object2', 'Object3'],
    locations: new Uint32Array(
      // prettier-ignore
      [
        // object_index  script_id  line  column
        0,              1,         10,   5,
        1,              2,         15,   8,
        2,              3,         20,   12,
      ],
    ),
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
    nodes: new Uint32Array(
      // prettier-ignore
      [
        // type  name  id  self_size  edge_count
        0,     0,    1,  100,       0,
      ],
    ),
    edges: new Uint32Array([]),
    strings: ['', 'Object1'],
    locations: new Uint32Array(
      // prettier-ignore
      [
        // object_index  script_id  line  column
        0,              1,         10,   5,
      ],
    ),
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
    nodes: new Uint32Array(
      // prettier-ignore
      [
        // type  name  id  self_size  edge_count
        0,     0,    1,  100,       0,
      ],
    ),
    edges: new Uint32Array([]),
    strings: ['', 'Object1'],
    locations: new Uint32Array(
      // prettier-ignore
      [
        // object_index  script_id  line  column
        0,              1,         10,   5,
      ],
    ),
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
    nodes: new Uint32Array(
      // prettier-ignore
      [
        // type  name  id  self_size  edge_count
        0,     0,    1,  100,       0,
      ],
    ),
    edges: new Uint32Array([]),
    strings: ['', 'Object1'],
    locations: new Uint32Array(
      // prettier-ignore
      [
        // script_id  line  column  object_index
        1,          10,   5,      0,
      ],
    ), // script_id=1, line=10, column=5, object_index=0
  }

  const indices = [0]

  const result = getLocationsMap(snapshot, indices)

  expect(result).toEqual(new Uint32Array([0]))
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
    nodes: new Uint32Array(
      // prettier-ignore
      [
        // type  name  id  self_size  edge_count
        0,     0,    1,  100,       0,
        0,     0,    2,   50,       0,
        0,     0,    3,   75,       0,
        0,     0,    4,   25,       0,
        0,     0,    5,  125,       0,
      ],
    ),
    edges: new Uint32Array([]),
    strings: ['', 'Object1', 'Object2', 'Object3', 'Object4', 'Object5'],
    locations: new Uint32Array(
      // prettier-ignore
      [
        // object_index  script_id  line  column
        0,              1,         10,   5,
        2,              2,         15,   8,
        4,              3,         20,   12,
      ],
    ),
  }

  const indices = [0, 2, 4]

  const result = getLocationsMap(snapshot, indices)

  // Expect full map length with offsets at indices 0,2,4
  expect(result).toEqual(new Uint32Array([0, 0, 4, 0, 8]))
})
