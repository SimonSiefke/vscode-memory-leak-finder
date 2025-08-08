import { expect, test } from '@jest/globals'
import { getRegexpObjectsFromHeapSnapshotInternal } from '../src/parts/GetRegexpObjectsFromHeapSnapshotInternal/GetRegexpObjectsFromHeapSnapshotInternal.js'
import { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('getRegexpObjectsFromHeapSnapshot - no regexp objects', async () => {
  // prettier-ignore
  const testData :Snapshot= {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 1,
      edge_count: 0,
      extra_native_bytes:0,
    nodes: new Uint32Array([
      0, 1, 100, 64, 0, 0, 0, // hidden object
    ]),
    edges:new Uint32Array([]),
    locations: new Uint32Array([]),
    strings: ['', 'test'],
  }
  const result = getRegexpObjectsFromHeapSnapshotInternal(testData)
  expect(result).toEqual([])
})

test('getRegexpObjectsFromHeapSnapshot - single regexp object', async () => {
  // prettier-ignore
  const testData :Snapshot= {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object', 'regexp']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 1,
      edge_count: 0,
      extra_native_bytes:0,
    nodes: new Uint32Array([
      4, 1, 200, 32, 0, 0, 0, // regexp object
    ]),
    edges: new Uint32Array([]),
    locations: new Uint32Array([]),
    strings: ['', '/test/gi'],
  }
  const result = getRegexpObjectsFromHeapSnapshotInternal(testData)
  expect(result).toEqual([
    {
      id: 200,
      pattern: '/test/gi',
    },
  ])
})

test('getRegexpObjectsFromHeapSnapshot - multiple regexp objects', async () => {
  // prettier-ignore
  const testData = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object', 'regexp']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 4,
      edge_count: 0,
    },
    nodes: [
      4, 1, 200, 32, 1, 0, 0, // first regexp
      0, 0, 201, 16, 0, 0, 0, // hidden object
      4, 2, 202, 28, 0, 0, 0, // second regexp
      4, 3, 203, 24, 2, 0, 0, // third regexp
    ],
    edges: [],
    locations: [],
    strings: ['', '/test/gi', '/hello/i', '/world/g'],
  }

  const result = await getRegexpObjectsFromHeapSnapshotInternal(testData)
  expect(result).toEqual([
    {
      id: 200,
      pattern: '/test/gi',
    },
    {
      id: 202,
      pattern: '/hello/i',
    },
    {
      id: 203,
      pattern: '/world/g',
    },
  ])
})
