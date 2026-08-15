import { expect, test } from '@jest/globals'
import { getRetainedBytesBySource } from '../src/parts/GetRetainedBytesBySource/GetRetainedBytesBySource.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('attributes dominated bytes to surviving allocation sources and applies the run threshold', async () => {
  const snapshot: Snapshot = {
    edge_count: 3,
    edges: Uint32Array.from([0, 0, 6, 0, 0, 18, 0, 0, 12]),
    extra_native_bytes: 0,
    locations: new Uint32Array(),
    meta: {
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['property']],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id'],
      node_types: [['hidden', 'object']],
      trace_function_info_fields: ['function_id', 'name', 'script_name', 'script_id', 'line', 'column'],
      trace_node_fields: ['id', 'function_info_index', 'count', 'size', 'children'],
    },
    node_count: 4,
    nodes: Uint32Array.from([0, 0, 1, 0, 2, 0, 1, 0, 3, 10, 1, 1, 1, 0, 5, 20, 0, 0, 1, 0, 7, 30, 0, 1]),
    strings: ['', 'allocate', 'file:///work/vscode/src/vs/editor/a.ts'],
    traceFunctionInfos: Uint32Array.from([1, 1, 2, 10, 4, 8]),
    traceTree: Uint32Array.from([1, 0, 2, 40]),
  }
  const result = await getRetainedBytesBySource(snapshot, { 10: { url: 'file:///work/vscode/src/vs/editor/a.ts' } }, 2)
  expect(result).toEqual({
    isLeak: true,
    sources: [{ allocationCount: 2, objectCount: 3, retainedBytes: 60, source: 'src/vs/editor/a.ts' }],
    totals: { allocationCount: 2, objectCount: 3, retainedBytes: 60 },
  })
})
