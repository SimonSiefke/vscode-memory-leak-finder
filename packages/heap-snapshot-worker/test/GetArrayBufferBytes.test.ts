import { expect, test } from '@jest/globals'
import { getArrayBufferBytes } from '../src/parts/GetArrayBufferBytes/GetArrayBufferBytes.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('counts ArrayBuffer backing stores and sums their native bytes', () => {
  const snapshot: Snapshot = {
    edge_count: 0,
    edges: new Uint32Array(),
    extra_native_bytes: 0,
    locations: new Uint32Array(),
    meta: {
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['internal']],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      node_types: [['hidden', 'object', 'native']],
    },
    node_count: 4,
    nodes: new Uint32Array([2, 1, 1, 1024, 0, 2, 1, 3, 2048, 0, 2, 2, 5, 4096, 0, 1, 3, 7, 64, 0]),
    strings: ['', 'system / JSArrayBufferData', 'other native data', 'ArrayBuffer'],
  }
  expect(getArrayBufferBytes(snapshot)).toEqual({ backingStoreCount: 2, bytes: 3072 })
})
