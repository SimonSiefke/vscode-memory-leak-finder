import { expect, test } from '@jest/globals'
import { getMemoryCitySnapshot } from '../src/parts/GetMemoryCitySnapshot/GetMemoryCitySnapshot.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('attributes allocation traces before locations and inherits through dominators', async () => {
  const snapshot: Snapshot = {
    edge_count: 3,
    edges: Uint32Array.from([
      0,
      0,
      6, // root -> allocated
      0,
      0,
      18, // root -> located
      0,
      0,
      12, // allocated -> inherited
    ]),
    extra_native_bytes: 0,
    locations: Uint32Array.from([
      6,
      20,
      1,
      1, // allocation takes precedence for node 1
      18,
      20,
      2,
      2, // location attributes node 3
    ]),
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
    nodes: Uint32Array.from([0, 0, 1, 0, 2, 0, 1, 0, 3, 10, 1, 1, 1, 0, 5, 20, 0, 0, 1, 0, 7, 30, 0, 0]),
    strings: ['', 'allocate', 'file:///work/vscode/src/vs/editor/a.ts'],
    traceFunctionInfos: Uint32Array.from([1, 1, 2, 10, 4, 8]),
    traceTree: Uint32Array.from([1, 0, 1, 10]),
  }

  const result = await getMemoryCitySnapshot(snapshot, {
    10: { url: 'file:///work/vscode/src/vs/editor/a.ts' },
    20: { url: 'file:///work/vscode/src/vs/workbench/b.ts' },
  })

  expect(result.buildings).toEqual([
    {
      kind: 'source',
      largestObjectRetainedBytes: 30,
      objectCount: 2,
      path: 'src/vs/editor/a.ts',
      retainedBytes: 30,
      shallowBytes: 30,
    },
    {
      kind: 'source',
      largestObjectRetainedBytes: 30,
      objectCount: 1,
      path: 'src/vs/workbench/b.ts',
      retainedBytes: 30,
      shallowBytes: 30,
    },
    {
      kind: 'runtime',
      largestObjectRetainedBytes: 60,
      objectCount: 1,
      path: 'runtime/unattributed/hidden',
      retainedBytes: 0,
      shallowBytes: 0,
    },
  ])
  expect(result.totals).toEqual({
    allocationTraceObjects: 1,
    attributedObjects: 3,
    locationObjects: 1,
    objectCount: 4,
    retainedBytes: 60,
    runtimeObjects: 1,
    shallowBytes: 60,
  })
})
