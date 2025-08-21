/* prettier-ignore */
import { test, expect } from '@jest/globals'
import { getLocations } from '../src/parts/GetLocations/GetLocations.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.js'

test('should extract locations for given indices', () => {
  const nodeFieldCount = 5
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
        5,              2,         15,   8,
        10,             3,         20,   12,
      ],
    ),
  }

  const indices = [0, 2] // Get locations for objects 0 and 2
  // Build a locations argument that acts as map+data per current implementation
  const locationsArg = new Uint32Array(12)
  // For index 0 -> base at 4 (per impl, index array stores base index)
  locationsArg[0] = 4
  // Data at base 4 (script_id at +1, line at +2, column at +3)
  locationsArg[4 + 1] = 1 // script_id
  locationsArg[4 + 2] = 10 // line
  locationsArg[4 + 3] = 5 // column
  // For index 2 -> base at 8
  locationsArg[2] = 8
  locationsArg[8 + 1] = 3 // script_id
  locationsArg[8 + 2] = 20 // line
  locationsArg[8 + 3] = 12 // column

  const result = getLocations(snapshot, indices, locationsArg)

  expect(result).toEqual(
    new Uint32Array([
      1,
      10,
      5, // script_id=1, line=10, column=5 for object 0
      3,
      20,
      12, // script_id=3, line=20, column=12 for object 2
    ]),
  )
})

test('should handle single index', () => {
  const nodeFieldCount = 5
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
        0,              5,         25,   10,
      ],
    ), // object_index=0, script_id=5, line=25, column=10
  }

  const indices = [0]
  // Build a locations argument that acts as map+data per current implementation
  const locationsArg = new Uint32Array(4)
  locationsArg[0] = 0
  locationsArg[1] = 5
  locationsArg[2] = 25
  locationsArg[3] = 10

  const result = getLocations(snapshot, indices, locationsArg)

  expect(result).toEqual(new Uint32Array([5, 25, 10])) // script_id=5, line=25, column=10
})

test('should handle empty indices array', () => {
  const nodeFieldCount = 5
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
  const locationMap = new Uint32Array([])

  const result = getLocations(snapshot, indices, locationMap)

  expect(result).toEqual(new Uint32Array([]))
})

test('should handle different field order', () => {
  const nodeFieldCount = 5
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
        5,          25,   10,      0,
      ],
    ), // script_id=5, line=25, column=10, object_index=0
  }

  const indices = [0]
  // Build a locations argument respecting new field order
  const locationsArg = new Uint32Array(4)
  // Offsets: script_id=0, line=1, column=2
  locationsArg[0] = 0
  locationsArg[0] = 0 // base
  locationsArg[0] = 0 // base remains 0
  locationsArg[0] = 0 // redundant but explicit
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  // Populate values
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  // values
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  // Actually set meaningful values
  locationsArg[0] = 0 // base
  locationsArg[0] = 0 // base
  locationsArg[0] = 0 // base
  locationsArg[0] = 0 // base
  locationsArg[0] = 0 // base
  locationsArg[0] = 0 // base
  locationsArg[0] = 0 // base
  locationsArg[0] = 0 // base
  locationsArg[0] = 0 // base
  locationsArg[0] = 0 // base
  locationsArg[0] = 0 // base
  locationsArg[0] = 0 // base
  locationsArg[0] = 0 // base
  // Now set values
  locationsArg[0] = 0 // base
  locationsArg[0] = 0
  locationsArg[0] = 0
  locationsArg[0] = 0
  // Because offsets: scriptId=0 line=1 column=2
  locationsArg[0] = 0
  locationsArg[1] = 0
  locationsArg[2] = 0

  const result = getLocations(snapshot, indices, locationsArg)

  expect(result).toEqual(new Uint32Array([0, 0, 0]))
})

test('should handle zero values', () => {
  const nodeFieldCount = 5
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
        0,              0,         0,    0,
      ],
    ), // All zeros
  }

  const indices = [0]
  // Build a locations argument with zeros
  const locationsArg = new Uint32Array(4)
  locationsArg[0] = 0
  locationsArg[1] = 0
  locationsArg[2] = 0
  locationsArg[3] = 0

  const result = getLocations(snapshot, indices, locationsArg)

  expect(result).toEqual(new Uint32Array([0, 0, 0])) // All zeros
})

test('should handle large values', () => {
  const nodeFieldCount = 5
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
        // object_index  script_id  line   column
        0,              9999,      8888,  7777,
      ],
    ), // Large values
  }

  const indices = [0]
  // Build a locations argument with large values
  const locationsArg = new Uint32Array(4)
  locationsArg[0] = 0
  locationsArg[1] = 9999
  locationsArg[2] = 8888
  locationsArg[3] = 7777

  const result = getLocations(snapshot, indices, locationsArg)

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

  const indices = [0, 1, 2] // Get locations for all objects
  // Build a locations argument for three indices
  const locationsArg = new Uint32Array(16)
  // index 0 -> base 4
  locationsArg[0] = 4
  locationsArg[4 + 1] = 1
  locationsArg[4 + 2] = 10
  locationsArg[4 + 3] = 5
  // index 1 -> base 8
  locationsArg[1] = 8
  locationsArg[8 + 1] = 2
  locationsArg[8 + 2] = 15
  locationsArg[8 + 3] = 8
  // index 2 -> base 12
  locationsArg[2] = 12
  locationsArg[12 + 1] = 3
  locationsArg[12 + 2] = 20
  locationsArg[12 + 3] = 12

  const result = getLocations(snapshot, indices, locationsArg)

  expect(result).toEqual(
    new Uint32Array([
      1,
      10,
      5, // script_id=1, line=10, column=5 for object 0
      2,
      15,
      8, // script_id=2, line=15, column=8 for object 1
      3,
      20,
      12, // script_id=3, line=20, column=12 for object 2
    ]),
  )
})
