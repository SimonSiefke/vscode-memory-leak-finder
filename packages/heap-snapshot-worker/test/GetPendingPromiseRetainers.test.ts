import { expect, test } from '@jest/globals'
import { getPendingPromiseRetainers } from '../src/parts/GetPendingPromiseRetainers/GetPendingPromiseRetainers.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('reports new pending promises with their shortest strong retaining path', () => {
  const snapshot: Snapshot = {
    edge_count: 2,
    edges: Uint32Array.from([0, 1, 6, 0, 2, 12]),
    extra_native_bytes: 0,
    locations: new Uint32Array(),
    meta: {
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['property', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id'],
      node_types: [['synthetic', 'object']],
    },
    node_count: 3,
    nodes: Uint32Array.from([0, 0, 1, 0, 1, 0, 1, 3, 3, 20, 1, 0, 1, 4, 5, 40, 0, 0]),
    strings: ['', 'holder', 'promise', 'Holder', 'Promise'],
  }
  const result = getPendingPromiseRetainers(snapshot, ['7'], ['5'], 1)
  expect(result.isLeak).toBe(true)
  expect(result.summary).toEqual({ pendingPromises: 1, retainedBytes: 40, retainingPaths: 1 })
  expect(result.retainers[0].path.map((segment) => segment.property)).toEqual(['holder', 'promise'])
})
