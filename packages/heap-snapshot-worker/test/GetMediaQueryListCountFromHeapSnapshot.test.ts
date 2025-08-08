import { test, expect } from '@jest/globals'
import { getMediaQueryListCountFromHeapSnapshotInternal } from '../src/parts/GetMediaQueryListCountFromHeapSnapshotInternal/GetMediaQueryListCountFromHeapSnapshotInternal.ts'
import { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('getMediaQueryListCountFromHeapSnapshot should return zero for no MediaQueryList objects', () => {
  const testData: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'regexp']],
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
    strings: [''],
  }
  const result = getMediaQueryListCountFromHeapSnapshotInternal(testData)
  expect(result).toBe(0)
})

test('getMediaQueryListCountFromHeapSnapshot should return correct count for MediaQueryList objects', () => {
  const testData: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 8,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      3,
      1,
      1,
      32,
      0,
      0,
      0, // MediaQueryList object
      3,
      1,
      2,
      32,
      0,
      0,
      0, // MediaQueryList object
      3,
      1,
      3,
      32,
      0,
      0,
      0, // MediaQueryList object
      1,
      2,
      4,
      32,
      0,
      0,
      0, // Array object
      3,
      1,
      5,
      32,
      0,
      0,
      0, // MediaQueryList object
      3,
      1,
      6,
      32,
      0,
      0,
      0, // MediaQueryList object
      3,
      1,
      7,
      32,
      0,
      0,
      0, // MediaQueryList object
      2,
      3,
      8,
      32,
      0,
      0,
      0, // String object
    ]),
    edges: new Uint32Array([]),
    locations: new Uint32Array([]),
    strings: ['', 'MediaQueryList', 'Array', 'String'],
  }
  const result = getMediaQueryListCountFromHeapSnapshotInternal(testData)
  expect(result).toBe(2)
})
