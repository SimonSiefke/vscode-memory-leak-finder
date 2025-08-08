import { expect, test } from '@jest/globals'
import { getMapObjectsFromHeapSnapshotInternal } from '../src/parts/GetMapObjectsFromHeapSnapshotInternal/GetMapObjectsFromHeapSnapshotInternal.js'
import { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('getMapObjectsFromHeapSnapshot - no map objects', () => {
  // prettier-ignore
  const testData:Snapshot = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 1,
      edge_count: 0,
    },
    nodes: new Uint32Array([
      0, 1, 100, 64, 0, 0, // hidden object
    ]),
    edges: new Uint32Array([]),
    locations: new Uint32Array([]),
    strings: ['', 'test'],
  }

  const result = getMapObjectsFromHeapSnapshotInternal(testData)
  expect(result).toEqual([])
})

test('getMapObjectsFromHeapSnapshot - map without variable name (filtered out)', () => {
  // prettier-ignore
  const testData :Snapshot= {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 1,
    edge_count: 0,
    extra_native_bytes:0,
    nodes: new Uint32Array([
      3,
      1,
      200,
      28,
      0,
      0, // object type, Map
    ]),
    edges: new Uint32Array([]),
    locations: new Uint32Array([]),
    strings: ['', 'Map'],
  }

  const result = getMapObjectsFromHeapSnapshotInternal(testData)
  // Should return empty array since Map has no variable names (prototype or system object)
  expect(result).toEqual([])
})

test('getMapObjectsFromHeapSnapshot - map with variable name', () => {
  // prettier-ignore
  const testData :Snapshot= {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 2,
      edge_count: 1,
      extra_native_bytes:0,
    nodes: new Uint32Array([
      3,
      1,
      100,
      64,
      1,
      0, // object (Window)
      3,
      2,
      200,
      28,
      0,
      0, // Map
    ]),
    edges: new Uint32Array([
      2,
      3,
      6, // property:"myMap" -> Map (node data index 6)
    ]),
    locations: new Uint32Array([]),
    strings: ['', 'Window', 'Map', 'myMap'],
  }

  const result = getMapObjectsFromHeapSnapshotInternal(testData)
  expect(result).toEqual([
    {
      id: 200,
      name: 'myMap',
      keys: [],
      note: 'Map object found in heap snapshot',
    },
  ])
})

test('getMapObjectsFromHeapSnapshot - multiple map objects with variables', () => {
  // prettier-ignore
  const testData :Snapshot= {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 4,
    edge_count: 2,
    extra_native_bytes:0,
    nodes:new Uint32Array([
      3,
      1,
      100,
      64,
      2,
      0, // object (App) - has 2 edges
      3,
      2,
      200,
      28,
      0,
      0, // Map
      3,
      2,
      300,
      28,
      0,
      0, // Map (second one)
      3,
      3,
      400,
      28,
      0,
      0, // Set (will be ignored)
    ]),
    edges: new Uint32Array([
      2,
      5,
      6, // property:"cache" -> Map (node data index 6)
      2,
      6,
      12, // property:"userCache" -> Map (node data index 12)
    ]),
    locations: new Uint32Array([]),
    strings: ['', 'App', 'Map', 'Set', 'WeakMap', 'cache', 'userCache', 'refs'],
  }

  const result = getMapObjectsFromHeapSnapshotInternal(testData)
  expect(result).toEqual([
    {
      id: 200,
      name: 'cache',
      keys: [],
      note: 'Map object found in heap snapshot',
    },
    {
      id: 300,
      name: 'userCache',
      keys: [],
      note: 'Map object found in heap snapshot',
    },
  ])
})

test('getMapObjectsFromHeapSnapshot - map with multiple variable names', () => {
  // prettier-ignore
  const testData:Snapshot = {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 2,
      edge_count: 2,
      extra_native_bytes:0,
    nodes: new Uint32Array([
      3,
      1,
      100,
      64,
      2,
      0, // object (Window) - has 2 edges
      3,
      2,
      200,
      28,
      0,
      0, // Map
    ]),
    edges:new Uint32Array( [
      2,
      3,
      6, // property:"cache" -> Map (node data index 6)
      2,
      4,
      6, // property:"storage" -> Map (node data index 6, same Map)
    ]),
    locations: new Uint32Array([]),
    strings: ['', 'Window', 'Map', 'cache', 'storage'],
  }

  const result = getMapObjectsFromHeapSnapshotInternal(testData)
  expect(result).toEqual([
    {
      id: 200,
      name: ['cache', 'storage'],
      keys: [],
      note: 'Map object found in heap snapshot',
    },
  ])
})
