import { expect, test } from '@jest/globals'
import { compareGrowingArraysInternal } from '../src/parts/CompareGrowingArraysInternal/CompareGrowingArraysInternal.js'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

const createBaseSnapshot = (): Snapshot => ({
  meta: {
    node_types: [['hidden', 'array', 'string', 'object']],
    node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
    edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
    edge_fields: ['type', 'name_or_index', 'to_node'],
    location_fields: ['object_index', 'script_id', 'line', 'column'],
  },
  node_count: 0,
  edge_count: 0,
  extra_native_bytes: 0,
  nodes: new Uint32Array([]),
  edges: new Uint32Array([]),
  locations: new Uint32Array([]),
  strings: ['', 'Array'],
})

test('should return zero counts for empty snapshots', () => {
  const snapshotA = createBaseSnapshot()
  const snapshotB = createBaseSnapshot()

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  expect(result).toEqual({ aCount: 0, bCount: 0 })
})

test('should return zero counts when no arrays are present', () => {
  const snapshotA: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 2,
    nodes: new Uint32Array([
      // Object 1 - type=object(3), name=''(0), id=1
      3, 0, 1, 64, 0, 0, 0,
      // String 1 - type=string(2), name=''(0), id=2
      2, 0, 2, 32, 0, 0, 0,
    ]),
    strings: ['', 'Array', 'SomeObject'],
  }

  const snapshotB: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 1,
    nodes: new Uint32Array([
      // Object 1 - type=object(3), name=''(0), id=1
      3, 0, 1, 64, 0, 0, 0,
    ]),
    strings: ['', 'Array', 'SomeObject'],
  }

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  expect(result).toEqual({ aCount: 0, bCount: 0 })
})

test('should count single array in snapshot A', () => {
  const snapshotA: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 1,
    nodes: new Uint32Array([
      // Array - type=object(3), name=Array(1), id=1
      3, 1, 1, 100, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const snapshotB = createBaseSnapshot()

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  expect(result).toEqual({ aCount: 1, bCount: 0 })
})

test('should count single array in snapshot B', () => {
  const snapshotA = createBaseSnapshot()

  const snapshotB: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 1,
    nodes: new Uint32Array([
      // Array - type=object(3), name=Array(1), id=1
      3, 1, 1, 100, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  expect(result).toEqual({ aCount: 0, bCount: 1 })
})

test('should count arrays in both snapshots', () => {
  const snapshotA: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 1,
    nodes: new Uint32Array([
      // Array - type=object(3), name=Array(1), id=1
      3, 1, 1, 100, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const snapshotB: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 1,
    nodes: new Uint32Array([
      // Array - type=object(3), name=Array(1), id=1
      3, 1, 1, 100, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  expect(result).toEqual({ aCount: 1, bCount: 1 })
})

test('should count multiple arrays in snapshot A', () => {
  const snapshotA: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 3,
    nodes: new Uint32Array([
      // Array 1 - type=object(3), name=Array(1), id=1
      3, 1, 1, 100, 0, 0, 0,
      // Array 2 - type=object(3), name=Array(1), id=2
      3, 1, 2, 200, 0, 0, 0,
      // Array 3 - type=object(3), name=Array(1), id=3
      3, 1, 3, 150, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const snapshotB = createBaseSnapshot()

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  expect(result).toEqual({ aCount: 3, bCount: 0 })
})

test('should count multiple arrays in snapshot B', () => {
  const snapshotA = createBaseSnapshot()

  const snapshotB: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 5,
    nodes: new Uint32Array([
      // Array 1 - type=object(3), name=Array(1), id=1
      3, 1, 1, 100, 0, 0, 0,
      // Array 2 - type=object(3), name=Array(1), id=2
      3, 1, 2, 200, 0, 0, 0,
      // Array 3 - type=object(3), name=Array(1), id=3
      3, 1, 3, 150, 0, 0, 0,
      // Array 4 - type=object(3), name=Array(1), id=4
      3, 1, 4, 180, 0, 0, 0,
      // Array 5 - type=object(3), name=Array(1), id=5
      3, 1, 5, 220, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  expect(result).toEqual({ aCount: 0, bCount: 5 })
})

test('should count arrays in both snapshots with different counts', () => {
  const snapshotA: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 2,
    nodes: new Uint32Array([
      // Array 1 - type=object(3), name=Array(1), id=1
      3, 1, 1, 100, 0, 0, 0,
      // Array 2 - type=object(3), name=Array(1), id=2
      3, 1, 2, 200, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const snapshotB: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 4,
    nodes: new Uint32Array([
      // Array 1 - type=object(3), name=Array(1), id=1
      3, 1, 1, 100, 0, 0, 0,
      // Array 2 - type=object(3), name=Array(1), id=2
      3, 1, 2, 200, 0, 0, 0,
      // Array 3 - type=object(3), name=Array(1), id=3
      3, 1, 3, 150, 0, 0, 0,
      // Array 4 - type=object(3), name=Array(1), id=4
      3, 1, 4, 180, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  expect(result).toEqual({ aCount: 2, bCount: 4 })
})

test('should ignore non-array objects', () => {
  const snapshotA: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 3,
    nodes: new Uint32Array([
      // Array - type=object(3), name=Array(1), id=1
      3, 1, 1, 100, 0, 0, 0,
      // Regular object - type=object(3), name=''(0), id=2
      3, 0, 2, 64, 0, 0, 0,
      // String - type=string(2), name=''(0), id=3
      2, 0, 3, 32, 0, 0, 0,
    ]),
    strings: ['', 'Array', 'SomeObject'],
  }

  const snapshotB: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 2,
    nodes: new Uint32Array([
      // Regular object - type=object(3), name=''(0), id=1
      3, 0, 1, 64, 0, 0, 0,
      // Array - type=object(3), name=Array(1), id=2
      3, 1, 2, 100, 0, 0, 0,
    ]),
    strings: ['', 'Array', 'SomeObject'],
  }

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  expect(result).toEqual({ aCount: 1, bCount: 1 })
})

test('should ignore objects with name other than Array', () => {
  const snapshotA: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 3,
    nodes: new Uint32Array([
      // Array - type=object(3), name=Array(1), id=1
      3, 1, 1, 100, 0, 0, 0,
      // Object with different name - type=object(3), name=Map(2), id=2
      3, 2, 2, 64, 0, 0, 0,
      // Object with different name - type=object(3), name=Set(3), id=3
      3, 3, 3, 64, 0, 0, 0,
    ]),
    strings: ['', 'Array', 'Map', 'Set'],
  }

  const snapshotB: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 2,
    nodes: new Uint32Array([
      // Object with different name - type=object(3), name=Map(2), id=1
      3, 2, 1, 64, 0, 0, 0,
      // Array - type=object(3), name=Array(1), id=2
      3, 1, 2, 100, 0, 0, 0,
    ]),
    strings: ['', 'Array', 'Map'],
  }

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  expect(result).toEqual({ aCount: 1, bCount: 1 })
})

test('should ignore non-object types even if named Array', () => {
  const snapshotA: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 3,
    nodes: new Uint32Array([
      // Array object - type=object(3), name=Array(1), id=1
      3, 1, 1, 100, 0, 0, 0,
      // String type with Array name - type=string(2), name=Array(1), id=2
      2, 1, 2, 32, 0, 0, 0,
      // Array type (not object) - type=array(1), name=Array(1), id=3
      1, 1, 3, 64, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const snapshotB = createBaseSnapshot()

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  expect(result).toEqual({ aCount: 1, bCount: 0 })
})

test('should handle large number of arrays', () => {
  const arrayCountA = 100
  const arrayCountB = 150

  const nodesA = new Uint32Array(arrayCountA * 7)
  const nodesB = new Uint32Array(arrayCountB * 7)

  for (let i = 0; i < arrayCountA; i++) {
    const offset = i * 7
    nodesA[offset + 0] = 3 // type = object
    nodesA[offset + 1] = 1 // name = Array
    nodesA[offset + 2] = i + 1 // id
    nodesA[offset + 3] = 100 + i // self_size
    nodesA[offset + 4] = 0 // edge_count
    nodesA[offset + 5] = 0 // trace_node_id
    nodesA[offset + 6] = 0 // detachedness
  }

  for (let i = 0; i < arrayCountB; i++) {
    const offset = i * 7
    nodesB[offset + 0] = 3 // type = object
    nodesB[offset + 1] = 1 // name = Array
    nodesB[offset + 2] = i + 1 // id
    nodesB[offset + 3] = 100 + i // self_size
    nodesB[offset + 4] = 0 // edge_count
    nodesB[offset + 5] = 0 // trace_node_id
    nodesB[offset + 6] = 0 // detachedness
  }

  const snapshotA: Snapshot = {
    ...createBaseSnapshot(),
    node_count: arrayCountA,
    nodes: nodesA,
    strings: ['', 'Array'],
  }

  const snapshotB: Snapshot = {
    ...createBaseSnapshot(),
    node_count: arrayCountB,
    nodes: nodesB,
    strings: ['', 'Array'],
  }

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  expect(result).toEqual({ aCount: arrayCountA, bCount: arrayCountB })
})

test('should handle arrays mixed with many other objects', () => {
  const snapshotA: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 10,
    nodes: new Uint32Array([
      // Array 1
      3, 1, 1, 100, 0, 0, 0,
      // Object
      3, 0, 2, 64, 0, 0, 0,
      // Array 2
      3, 1, 3, 200, 0, 0, 0,
      // String
      2, 0, 4, 32, 0, 0, 0,
      // Array 3
      3, 1, 5, 150, 0, 0, 0,
      // Object
      3, 0, 6, 64, 0, 0, 0,
      // Array 4
      3, 1, 7, 180, 0, 0, 0,
      // Object
      3, 0, 8, 64, 0, 0, 0,
      // Array 5
      3, 1, 9, 220, 0, 0, 0,
      // Object
      3, 0, 10, 64, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const snapshotB: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 8,
    nodes: new Uint32Array([
      // Object
      3, 0, 1, 64, 0, 0, 0,
      // Array 1
      3, 1, 2, 100, 0, 0, 0,
      // Object
      3, 0, 3, 64, 0, 0, 0,
      // Array 2
      3, 1, 4, 200, 0, 0, 0,
      // String
      2, 0, 5, 32, 0, 0, 0,
      // Array 3
      3, 1, 6, 150, 0, 0, 0,
      // Object
      3, 0, 7, 64, 0, 0, 0,
      // Array 4
      3, 1, 8, 180, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  expect(result).toEqual({ aCount: 5, bCount: 4 })
})

test('should handle different node field orders', () => {
  // Test with different field order: ['name', 'type', 'id', ...]
  // The nodes array must match the field order
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object']],
      node_fields: ['name', 'type', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // Array 1 - name=Array(1), type=object(3), id=1, self_size=100, edge_count=0, trace_node_id=0, detachedness=0
      1, 3, 1, 100, 0, 0, 0,
      // Array 2 - name=Array(1), type=object(3), id=2, self_size=200, edge_count=0, trace_node_id=0, detachedness=0
      1, 3, 2, 200, 0, 0, 0,
    ]),
    edges: new Uint32Array([]),
    locations: new Uint32Array([]),
    strings: ['', 'Array'],
  }

  const snapshotB: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 1,
    nodes: new Uint32Array([
      // Array - type=object(3), name=Array(1), id=1, self_size=100, edge_count=0, trace_node_id=0, detachedness=0
      3, 1, 1, 100, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  // Should still work correctly even with different field order
  expect(result).toEqual({ aCount: 2, bCount: 1 })
})

test('should handle empty strings array', () => {
  const snapshotA: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 1,
    nodes: new Uint32Array([
      // Array - type=object(3), name=Array(1), but strings array is empty
      3, 0, 1, 100, 0, 0, 0,
    ]),
    strings: [],
  }

  const snapshotB = createBaseSnapshot()

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  // Should not crash, but won't match Array name since strings[0] is undefined
  expect(result).toEqual({ aCount: 0, bCount: 0 })
})

test('should handle Array string at different index', () => {
  const snapshotA: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 2,
    nodes: new Uint32Array([
      // Array 1 - type=object(3), name=Array(5), id=1
      3, 5, 1, 100, 0, 0, 0,
      // Array 2 - type=object(3), name=Array(5), id=2
      3, 5, 2, 200, 0, 0, 0,
    ]),
    strings: ['', 'SomeObject', 'AnotherObject', 'YetAnother', 'Map', 'Array'],
  }

  const snapshotB: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 1,
    nodes: new Uint32Array([
      // Array - type=object(3), name=Array(1), id=1
      3, 1, 1, 100, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  expect(result).toEqual({ aCount: 2, bCount: 1 })
})

test('should handle snapshots with only arrays', () => {
  const snapshotA: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 7,
    nodes: new Uint32Array([
      // All arrays
      3, 1, 1, 100, 0, 0, 0,
      3, 1, 2, 200, 0, 0, 0,
      3, 1, 3, 150, 0, 0, 0,
      3, 1, 4, 180, 0, 0, 0,
      3, 1, 5, 220, 0, 0, 0,
      3, 1, 6, 190, 0, 0, 0,
      3, 1, 7, 210, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const snapshotB: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 3,
    nodes: new Uint32Array([
      // All arrays
      3, 1, 1, 100, 0, 0, 0,
      3, 1, 2, 200, 0, 0, 0,
      3, 1, 3, 150, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  expect(result).toEqual({ aCount: 7, bCount: 3 })
})

test('should handle arrays with different sizes', () => {
  const snapshotA: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 3,
    nodes: new Uint32Array([
      // Small array
      3, 1, 1, 10, 0, 0, 0,
      // Medium array
      3, 1, 2, 1000, 0, 0, 0,
      // Large array
      3, 1, 3, 100000, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const snapshotB: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 2,
    nodes: new Uint32Array([
      // Small array
      3, 1, 1, 5, 0, 0, 0,
      // Large array
      3, 1, 2, 50000, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  // Size doesn't matter, only count
  expect(result).toEqual({ aCount: 3, bCount: 2 })
})

test('should handle arrays with edges', () => {
  const snapshotA: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 2,
    nodes: new Uint32Array([
      // Array with edges - type=object(3), name=Array(1), id=1, edge_count=2
      3, 1, 1, 100, 2, 0, 0,
      // Array without edges - type=object(3), name=Array(1), id=2, edge_count=0
      3, 1, 2, 200, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const snapshotB: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 1,
    nodes: new Uint32Array([
      // Array with many edges - type=object(3), name=Array(1), id=1, edge_count=10
      3, 1, 1, 100, 10, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  // Edge count doesn't matter, only type and name
  expect(result).toEqual({ aCount: 2, bCount: 1 })
})

test('should handle arrays with trace_node_id', () => {
  const snapshotA: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 3,
    nodes: new Uint32Array([
      // Array with trace_node_id=0
      3, 1, 1, 100, 0, 0, 0,
      // Array with trace_node_id=1
      3, 1, 2, 200, 0, 0, 1,
      // Array with trace_node_id=5
      3, 1, 3, 150, 0, 0, 5,
    ]),
    strings: ['', 'Array'],
  }

  const snapshotB: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 2,
    nodes: new Uint32Array([
      // Array with trace_node_id=2
      3, 1, 1, 100, 0, 0, 2,
      // Array with trace_node_id=3
      3, 1, 2, 200, 0, 0, 3,
    ]),
    strings: ['', 'Array'],
  }

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  // trace_node_id doesn't matter, only type and name
  expect(result).toEqual({ aCount: 3, bCount: 2 })
})

test('should handle arrays with detachedness', () => {
  const snapshotA: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 2,
    nodes: new Uint32Array([
      // Array with detachedness=0 (attached)
      3, 1, 1, 100, 0, 0, 0,
      // Array with detachedness=1 (detached)
      3, 1, 2, 200, 0, 0, 1,
    ]),
    strings: ['', 'Array'],
  }

  const snapshotB: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 1,
    nodes: new Uint32Array([
      // Array with detachedness=1 (detached)
      3, 1, 1, 100, 0, 0, 1,
    ]),
    strings: ['', 'Array'],
  }

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  // detachedness doesn't matter, only type and name
  expect(result).toEqual({ aCount: 2, bCount: 1 })
})

test('should handle case where snapshot A has zero arrays and B has many', () => {
  const snapshotA: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 5,
    nodes: new Uint32Array([
      // Only non-array objects
      3, 0, 1, 64, 0, 0, 0,
      3, 0, 2, 64, 0, 0, 0,
      3, 0, 3, 64, 0, 0, 0,
      2, 0, 4, 32, 0, 0, 0,
      3, 0, 5, 64, 0, 0, 0,
    ]),
    strings: ['', 'Array', 'SomeObject'],
  }

  const snapshotB: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 10,
    nodes: new Uint32Array([
      // All arrays
      3, 1, 1, 100, 0, 0, 0,
      3, 1, 2, 200, 0, 0, 0,
      3, 1, 3, 150, 0, 0, 0,
      3, 1, 4, 180, 0, 0, 0,
      3, 1, 5, 220, 0, 0, 0,
      3, 1, 6, 190, 0, 0, 0,
      3, 1, 7, 210, 0, 0, 0,
      3, 1, 8, 240, 0, 0, 0,
      3, 1, 9, 160, 0, 0, 0,
      3, 1, 10, 130, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  expect(result).toEqual({ aCount: 0, bCount: 10 })
})

test('should handle case where snapshot B has zero arrays and A has many', () => {
  const snapshotA: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 8,
    nodes: new Uint32Array([
      // All arrays
      3, 1, 1, 100, 0, 0, 0,
      3, 1, 2, 200, 0, 0, 0,
      3, 1, 3, 150, 0, 0, 0,
      3, 1, 4, 180, 0, 0, 0,
      3, 1, 5, 220, 0, 0, 0,
      3, 1, 6, 190, 0, 0, 0,
      3, 1, 7, 210, 0, 0, 0,
      3, 1, 8, 250, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const snapshotB: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 4,
    nodes: new Uint32Array([
      // Only non-array objects
      3, 0, 1, 64, 0, 0, 0,
      3, 0, 2, 64, 0, 0, 0,
      2, 0, 3, 32, 0, 0, 0,
      3, 0, 4, 64, 0, 0, 0,
    ]),
    strings: ['', 'Array', 'SomeObject'],
  }

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  expect(result).toEqual({ aCount: 8, bCount: 0 })
})

test('should handle identical snapshots with same array count', () => {
  const snapshotA: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 5,
    nodes: new Uint32Array([
      3, 1, 1, 100, 0, 0, 0,
      3, 1, 2, 200, 0, 0, 0,
      3, 1, 3, 150, 0, 0, 0,
      3, 1, 4, 180, 0, 0, 0,
      3, 1, 5, 220, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const snapshotB: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 5,
    nodes: new Uint32Array([
      3, 1, 1, 100, 0, 0, 0,
      3, 1, 2, 200, 0, 0, 0,
      3, 1, 3, 150, 0, 0, 0,
      3, 1, 4, 180, 0, 0, 0,
      3, 1, 5, 220, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  expect(result).toEqual({ aCount: 5, bCount: 5 })
})

test('should handle sparse arrays in nodes array', () => {
  const snapshotA: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 3,
    nodes: new Uint32Array([
      // Array 1
      3, 1, 1, 100, 0, 0, 0,
      // Array 2 (skipping some fields would be invalid, but testing with valid sparse-like structure)
      3, 1, 2, 200, 0, 0, 0,
      // Array 3
      3, 1, 3, 150, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const snapshotB: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 1,
    nodes: new Uint32Array([
      // Array 1
      3, 1, 1, 100, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  expect(result).toEqual({ aCount: 3, bCount: 1 })
})

test('should handle very large array counts', () => {
  const arrayCountA = 1000
  const arrayCountB = 2000

  const nodesA = new Uint32Array(arrayCountA * 7)
  const nodesB = new Uint32Array(arrayCountB * 7)

  for (let i = 0; i < arrayCountA; i++) {
    const offset = i * 7
    nodesA[offset + 0] = 3
    nodesA[offset + 1] = 1
    nodesA[offset + 2] = i + 1
    nodesA[offset + 3] = 100
    nodesA[offset + 4] = 0
    nodesA[offset + 5] = 0
    nodesA[offset + 6] = 0
  }

  for (let i = 0; i < arrayCountB; i++) {
    const offset = i * 7
    nodesB[offset + 0] = 3
    nodesB[offset + 1] = 1
    nodesB[offset + 2] = i + 1
    nodesB[offset + 3] = 100
    nodesB[offset + 4] = 0
    nodesB[offset + 5] = 0
    nodesB[offset + 6] = 0
  }

  const snapshotA: Snapshot = {
    ...createBaseSnapshot(),
    node_count: arrayCountA,
    nodes: nodesA,
    strings: ['', 'Array'],
  }

  const snapshotB: Snapshot = {
    ...createBaseSnapshot(),
    node_count: arrayCountB,
    nodes: nodesB,
    strings: ['', 'Array'],
  }

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  expect(result).toEqual({ aCount: arrayCountA, bCount: arrayCountB })
})

test('should correctly identify Array name regardless of string index', () => {
  const snapshotA: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 2,
    nodes: new Uint32Array([
      // Array with name at index 10
      3, 10, 1, 100, 0, 0, 0,
      // Array with name at index 10
      3, 10, 2, 200, 0, 0, 0,
    ]),
    strings: ['', 'Object1', 'Object2', 'Object3', 'Object4', 'Object5', 'Object6', 'Object7', 'Object8', 'Object9', 'Array'],
  }

  const snapshotB: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 1,
    nodes: new Uint32Array([
      // Array with name at index 1
      3, 1, 1, 100, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  expect(result).toEqual({ aCount: 2, bCount: 1 })
})

test('should handle arrays with same count but different properties', () => {
  const snapshotA: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 3,
    nodes: new Uint32Array([
      // Array with large size
      3, 1, 1, 1000000, 5, 1, 0,
      // Array with medium size
      3, 1, 2, 50000, 2, 0, 1,
      // Array with small size
      3, 1, 3, 100, 0, 0, 0,
    ]),
    strings: ['', 'Array'],
  }

  const snapshotB: Snapshot = {
    ...createBaseSnapshot(),
    node_count: 3,
    nodes: new Uint32Array([
      // Array with different size
      3, 1, 1, 2000000, 10, 2, 1,
      // Array with different size
      3, 1, 2, 25000, 1, 1, 0,
      // Array with different size
      3, 1, 3, 50, 0, 0, 1,
    ]),
    strings: ['', 'Array'],
  }

  const result = compareGrowingArraysInternal(snapshotA, snapshotB)

  // Count should be the same regardless of other properties
  expect(result).toEqual({ aCount: 3, bCount: 3 })
})
