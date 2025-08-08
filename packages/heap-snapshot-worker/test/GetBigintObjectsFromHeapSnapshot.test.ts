import { expect, test } from '@jest/globals'
import { getBigintObjectsFromHeapSnapshotInternal } from '../src/parts/GetBigintObjectsFromHeapSnapshotInternal/GetBigintObjectsFromHeapSnapshotInternal.js'
import { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('getBigintObjectsFromHeapSnapshot - no bigint objects', () => {
  // prettier-ignore
  const testData:Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 1,
    edge_count: 0,
    nodes: new Uint32Array([
      0, 1, 100, 64, 0, 0, // hidden object
    ]),
    edges: new Uint32Array([]),
    locations: new Uint32Array([]),
    strings: ['', 'test'],
  }

  const result = getBigintObjectsFromHeapSnapshotInternal(testData)
  expect(result).toEqual([])
})

test('getBigintObjectsFromHeapSnapshot - single bigint object without variable name (filtered out)', () => {
  // prettier-ignore
  const testData = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object', 'bigint']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 1,
      edge_count: 0,
    },
    nodes: [
      4, 1, 200, 32, 0, 0, // bigint object
    ],
    edges: [],
    locations: [],
    strings: ['', 'bigint'],
  }

  const result = getBigintObjectsFromHeapSnapshotInternal(testData)
  // Should return empty array since bigint has no variable names (embedded constant)
  expect(result).toEqual([])
})

test('getBigintObjectsFromHeapSnapshot - multiple bigint objects (embedded constants filtered out)', () => {
  // prettier-ignore
  const testData = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object', 'bigint']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 4,
      edge_count: 0,
    },
    nodes: [
      4, 1, 200, 32, 1, 0, // first bigint (embedded constant)
      0, 0, 201, 16, 0, 0, // hidden object
      4, 1, 202, 28, 0, 0, // second bigint (embedded constant)
      4, 1, 203, 24, 2, 0, // third bigint (embedded constant)
    ],
    edges: [],
    locations: [],
    strings: ['', 'bigint'],
  }

  const result = getBigintObjectsFromHeapSnapshotInternal(testData)
  // Should return empty array since all bigints have no variable names (embedded constants)
  expect(result).toEqual([])
})

test('getBigintObjectsFromHeapSnapshot - bigint with variable name', () => {
  // prettier-ignore
  const testData = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object', 'bigint']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 2,
      edge_count: 1,
    },
    nodes: [
      3, 1, 100, 64, 1, 0, // object (Window)
      4, 2, 200, 32, 0, 0, // bigint
    ],
    edges: [
      2,
      3,
      6, // property:"abc" -> bigint (node data index 6)
    ],
    locations: [],
    strings: ['', 'Window', 'bigint', 'abc'],
  }

  const result = getBigintObjectsFromHeapSnapshotInternal(testData)
  expect(result).toEqual([
    {
      id: 200,
      name: 'bigint',
      value: 'bigint',
      selfSize: 32,
      edgeCount: 0,
      detachedness: 0,
      variableNames: [
        {
          name: 'abc',
          sourceType: 'object',
          sourceName: 'Window',
        },
      ],
      note: 'Actual bigint numeric value not accessible via heap snapshot format',
    },
  ])
})
