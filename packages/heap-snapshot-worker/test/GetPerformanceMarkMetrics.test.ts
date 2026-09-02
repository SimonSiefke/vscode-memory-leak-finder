import { expect, test } from '@jest/globals'
import { getPerformanceMarkMetrics } from '../src/parts/GetPerformanceMarkMetrics/GetPerformanceMarkMetrics.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('counts native PerformanceMark nodes and sums their self sizes', () => {
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
      node_types: [['hidden', 'object', 'native', 'closure', 'string']],
    },
    node_count: 5,
    nodes: new Uint32Array([2, 1, 1, 128, 0, 2, 1, 3, 144, 0, 1, 1, 5, 16, 0, 3, 1, 7, 32, 0, 2, 2, 9, 256, 0]),
    strings: ['', 'PerformanceMark', 'OtherNativeObject'],
  }

  expect(getPerformanceMarkMetrics(snapshot)).toEqual({ bytes: 272, count: 2 })
})
