import { test, expect } from '@jest/globals'
import { compareNamedClosureCountFromHeapSnapshotInternal2 } from '../src/parts/CompareNamedClosureCountInternal2/CompareNamedClosureCountInternal2.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('should return empty object when no closures leaked', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: object_index=0, script_id=1, line=10, column=5
    ]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0) - same
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1) - same
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: same location
    ]),
  }

  const result = await compareNamedClosureCountFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toEqual({})
})

test('should detect single leaked closure at one location', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: object_index=0, script_id=1, line=10, column=5
    ]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 4,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0) - same
      5, 0, 2, 50, 1, 0, 0, // Closure 2 (node 2, id=2) - NEW LEAK
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1, id=1)
      3, 0, 3, 30, 1, 0, 0, // Context 2 (node 3, id=3)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
      0, 3, 21, // Closure 2 -> Context 2
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: same closure (count=1), object_index=0 (byte offset)
      7, 1, 10, 5, // location 1: NEW closure at same location (count=2, increased), object_index=7 (byte offset for Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toEqual({
    '1:10:5': [
      {
        nodeIndex: 7,
        nodeName: 'anonymous',
        nodeId: 2,
      },
    ],
  })
})

test('should detect multiple leaked closures at same location', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0
    ]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 6,
    edge_count: 3,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0) - same
      5, 0, 2, 50, 1, 0, 0, // Closure 2 (node 2) - LEAK 1
      5, 0, 4, 50, 1, 0, 0, // Closure 3 (node 4) - LEAK 2
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
      3, 0, 3, 30, 1, 0, 0, // Context 2 (node 3)
      3, 0, 5, 30, 1, 0, 0, // Context 3 (node 5)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
      0, 3, 21, // Closure 2 -> Context 2
      0, 3, 35, // Closure 3 -> Context 3
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: same closure, object_index=0
      7, 1, 10, 5, // location 1: NEW closure 1 at same location, object_index=7 (Closure 2)
      14, 1, 10, 5, // location 2: NEW closure 2 at same location, object_index=14 (Closure 3)
    ]),
  }

  const result = await compareNamedClosureCountFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toEqual({
    '1:10:5': [
      {
        nodeIndex: 7,
        nodeName: 'anonymous',
        nodeId: 2,
      },
      {
        nodeIndex: 14,
        nodeName: 'anonymous',
        nodeId: 4,
      },
    ],
  })
})

test('should detect leaked closures at different locations', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: script_id=1, line=10, column=5
    ]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 6,
    edge_count: 3,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0) - same
      5, 0, 2, 50, 1, 0, 0, // Closure 2 (node 2) - LEAK at location 1
      5, 0, 4, 50, 1, 0, 0, // Closure 3 (node 4) - LEAK at location 2
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
      3, 0, 3, 30, 1, 0, 0, // Context 2 (node 3)
      3, 0, 5, 30, 1, 0, 0, // Context 3 (node 5)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
      0, 3, 21, // Closure 2 -> Context 2
      0, 3, 35, // Closure 3 -> Context 3
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: same closure, object_index=0
      7, 1, 20, 10, // location 1: NEW closure at different location, object_index=7 (Closure 2)
      14, 1, 30, 15, // location 2: NEW closure at different location, object_index=14 (Closure 3)
    ]),
  }

  const result = await compareNamedClosureCountFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toEqual({
    '1:20:10': [
      {
        nodeIndex: 7,
        nodeName: 'anonymous',
        nodeId: 2,
      },
    ],
    '1:30:15': [
      {
        nodeIndex: 14,
        nodeName: 'anonymous',
        nodeId: 4,
      },
    ],
  })
})

test('should not detect same closure with same nodeId as leak', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0
    ]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0) - same ID
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: same closure
      0, 1, 10, 5, // location 1: same closure again (count increased but same node)
    ]),
  }

  const result = await compareNamedClosureCountFromHeapSnapshotInternal2(snapshotA, snapshotB)
  const key = '1:10:5'
  if (key in result) {
    expect(result[key]).toHaveLength(0)
  } else {
    expect(result).toEqual({})
  }
})

test('should detect closure with named function', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 1, 0, 50, 1, 0, 0, // Closure 1 (node 0, name='myFunction')
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'myFunction', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0
    ]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 4,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 1, 0, 50, 1, 0, 0, // Closure 1 (node 0) - same
      5, 1, 2, 50, 1, 0, 0, // Closure 2 (node 2, name='myFunction') - NEW LEAK
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
      3, 0, 3, 30, 1, 0, 0, // Context 2 (node 3)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
      0, 3, 21, // Closure 2 -> Context 2
    ]),
    strings: ['', 'myFunction', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: same closure, object_index=0
      7, 1, 10, 5, // location 1: NEW closure at same location, object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toEqual({
    '1:10:5': [
      {
        nodeIndex: 7,
        nodeName: 'myFunction',
        nodeId: 2,
      },
    ],
  })
})

test('should handle closures with different names at same location', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 1, 0, 50, 1, 0, 0, // Closure 1 (node 0, name='funcA')
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'funcA', 'funcB'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0
    ]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 4,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 1, 0, 50, 1, 0, 0, // Closure 1 (node 0, name='funcA') - same
      5, 2, 2, 50, 1, 0, 0, // Closure 2 (node 2, name='funcB') - NEW LEAK
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
      3, 0, 3, 30, 1, 0, 0, // Context 2 (node 3)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
      0, 3, 21, // Closure 2 -> Context 2
    ]),
    strings: ['', 'funcA', 'funcB'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: same closure, object_index=0
      7, 1, 10, 5, // location 1: NEW closure at same location, object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toEqual({
    '1:10:5': [
      {
        nodeIndex: 7,
        nodeName: 'funcB',
        nodeId: 2,
      },
    ],
  })
})

test('should handle empty locations in snapshotA', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([]), // No locations
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 4,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0)
      5, 0, 2, 50, 1, 0, 0, // Closure 2 (node 2) - NEW
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
      3, 0, 3, 30, 1, 0, 0, // Context 2 (node 3)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
      0, 3, 21, // Closure 2 -> Context 2
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0, object_index=0
      7, 1, 10, 5, // location 1: NEW closure, object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toEqual({
    '1:10:5': [
      {
        nodeIndex: 7,
        nodeName: 'anonymous',
        nodeId: 2,
      },
    ],
  })
})

test('should handle empty locations in snapshotB', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0
    ]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([]), // No locations
  }

  const result = await compareNamedClosureCountFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toEqual({})
})

test('should handle multiple leaks with same name but different IDs', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 1, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0, name='myFunc')
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'myFunc'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0
    ]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 6,
    edge_count: 3,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 1, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0, name='myFunc') - same
      5, 1, 2, 50, 1, 0, 0, // Closure 2 (node 2, id=2, name='myFunc') - LEAK 1
      5, 1, 4, 50, 1, 0, 0, // Closure 3 (node 4, id=4, name='myFunc') - LEAK 2
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
      3, 0, 3, 30, 1, 0, 0, // Context 2 (node 3)
      3, 0, 5, 30, 1, 0, 0, // Context 3 (node 5)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
      0, 3, 21, // Closure 2 -> Context 2
      0, 3, 35, // Closure 3 -> Context 3
    ]),
    strings: ['', 'myFunc'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: same closure, object_index=0
      7, 1, 10, 5, // location 1: NEW closure 1, object_index=7 (Closure 2)
      14, 1, 10, 5, // location 2: NEW closure 2, object_index=14 (Closure 3)
    ]),
  }

  const result = await compareNamedClosureCountFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toEqual({
    '1:10:5': [
      {
        nodeIndex: 7,
        nodeName: 'myFunc',
        nodeId: 2,
      },
      {
        nodeIndex: 14,
        nodeName: 'myFunc',
        nodeId: 4,
      },
    ],
  })
})

test('should handle closures at different script IDs', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: script_id=1
    ]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 4,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0) - same
      5, 0, 2, 50, 1, 0, 0, // Closure 2 (node 2) - LEAK at script 2
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
      3, 0, 3, 30, 1, 0, 0, // Context 2 (node 3)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
      0, 3, 21, // Closure 2 -> Context 2
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: script_id=1, same, object_index=0
      7, 2, 10, 5, // location 1: script_id=2, NEW, object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toEqual({
    '2:10:5': [
      {
        nodeIndex: 7,
        nodeName: 'anonymous',
        nodeId: 2,
      },
    ],
  })
})

test('should handle closures at different lines', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: line=10
    ]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 4,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0) - same
      5, 0, 2, 50, 1, 0, 0, // Closure 2 (node 2) - LEAK at line 20
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
      3, 0, 3, 30, 1, 0, 0, // Context 2 (node 3)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
      0, 3, 21, // Closure 2 -> Context 2
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: line=10, same, object_index=0
      7, 1, 20, 5, // location 1: line=20, NEW, object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toEqual({
    '1:20:5': [
      {
        nodeIndex: 7,
        nodeName: 'anonymous',
        nodeId: 2,
      },
    ],
  })
})

test('should handle closures at different columns', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: column=5
    ]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 4,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0) - same
      5, 0, 2, 50, 1, 0, 0, // Closure 2 (node 2) - LEAK at column 10
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
      3, 0, 3, 30, 1, 0, 0, // Context 2 (node 3)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
      0, 3, 21, // Closure 2 -> Context 2
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: column=5, same, object_index=0
      7, 1, 10, 10, // location 1: column=10, NEW, object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toEqual({
    '1:10:10': [
      {
        nodeIndex: 7,
        nodeName: 'anonymous',
        nodeId: 2,
      },
    ],
  })
})

test('should handle complex scenario with multiple locations and leaks', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 4,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 1, 0, 50, 1, 0, 0, // Closure 1 (node 0, name='funcA')
      5, 2, 2, 50, 1, 0, 0, // Closure 2 (node 2, name='funcB')
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
      3, 0, 3, 30, 1, 0, 0, // Context 2 (node 3)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
      0, 3, 21, // Closure 2 -> Context 2
    ]),
    strings: ['', 'funcA', 'funcB'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: funcA
      14, 1, 20, 10, // location 1: funcB
    ]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 10,
    edge_count: 5,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 1, 0, 50, 1, 0, 0, // Closure 1 (node 0, name='funcA') - same
      5, 2, 2, 50, 1, 0, 0, // Closure 2 (node 2, name='funcB') - same
      5, 1, 4, 50, 1, 0, 0, // Closure 3 (node 4, name='funcA') - LEAK at location 0
      5, 2, 6, 50, 1, 0, 0, // Closure 4 (node 6, name='funcB') - LEAK at location 1
      5, 1, 8, 50, 1, 0, 0, // Closure 5 (node 8, name='funcA') - LEAK at location 2
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
      3, 0, 3, 30, 1, 0, 0, // Context 2 (node 3)
      3, 0, 5, 30, 1, 0, 0, // Context 3 (node 5)
      3, 0, 7, 30, 1, 0, 0, // Context 4 (node 7)
      3, 0, 9, 30, 1, 0, 0, // Context 5 (node 9)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
      0, 3, 21, // Closure 2 -> Context 2
      0, 3, 35, // Closure 3 -> Context 3
      0, 3, 49, // Closure 4 -> Context 4
      0, 3, 63, // Closure 5 -> Context 5
    ]),
    strings: ['', 'funcA', 'funcB'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: funcA, same, object_index=0
      14, 1, 20, 10, // location 1: funcB, same, object_index=14 (Closure 2)
      28, 1, 10, 5, // location 2: funcA, NEW leak, object_index=28 (Closure 3)
      42, 1, 20, 10, // location 3: funcB, NEW leak, object_index=42 (Closure 4)
      56, 1, 30, 15, // location 4: funcA, NEW leak at new location, object_index=56 (Closure 5)
    ]),
  }

  const result = await compareNamedClosureCountFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toEqual({
    '1:10:5': [
      {
        nodeIndex: 28,
        nodeName: 'funcA',
        nodeId: 4,
      },
    ],
    '1:30:15': [
      {
        nodeIndex: 56,
        nodeName: 'funcA',
        nodeId: 8,
      },
    ],
  })
})

test('should handle node name fallback to anonymous when string index is invalid', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0
    ]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 4,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0) - same
      5, 99, 2, 50, 1, 0, 0, // Closure 2 (node 2, name index 99 - invalid)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
      3, 0, 3, 30, 1, 0, 0, // Context 2 (node 3)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
      0, 3, 21, // Closure 2 -> Context 2
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: same closure, object_index=0
      7, 1, 10, 5, // location 1: NEW closure, object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toEqual({
    '1:10:5': [
      {
        nodeIndex: 7,
        nodeName: 'anonymous',
        nodeId: 2,
      },
    ],
  })
})

test('should handle count increase but no new unique nodes', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0
    ]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0) - same
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: same closure
      0, 1, 10, 5, // location 1: same closure again (count increased)
    ]),
  }

  const result = await compareNamedClosureCountFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toEqual({})
})

test('should handle empty snapshots', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 0,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([]),
    edges: new Uint32Array([]),
    strings: [''],
    locations: new Uint32Array([]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 0,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([]),
    edges: new Uint32Array([]),
    strings: [''],
    locations: new Uint32Array([]),
  }

  const result = await compareNamedClosureCountFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toEqual({})
})

test('should handle snapshotB with no new locations', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0
    ]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0) - same
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: same, but count decreased
    ]),
  }

  const result = await compareNamedClosureCountFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toEqual({})
})
