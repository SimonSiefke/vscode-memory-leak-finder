import { expect, test } from '@jest/globals'
import { getMapCountFromHeapSnapshotInternal } from '../src/parts/GetMapCountFromHeapSnapshotInternal/GetMapCountFromHeapSnapshotInternal.js'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('getMapCountFromHeapSnapshot should return zero for no maps', () => {
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
    edges: new Uint32Array([]),
    locations: new Uint32Array([]),
    strings: ['', 'test'],
  }
  const result = getMapCountFromHeapSnapshotInternal(testData)
  expect(result).toEqual(0)
})

// TODO add more tests
