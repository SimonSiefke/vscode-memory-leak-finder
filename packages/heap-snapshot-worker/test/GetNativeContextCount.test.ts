import { expect, test } from '@jest/globals'
import { getNativeContextCount } from '../src/parts/GetNativeContextCount/GetNativeContextCount.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('counts hidden V8 NativeContext nodes, including URL-qualified contexts', () => {
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
      node_types: [['hidden', 'string']],
    },
    node_count: 4,
    nodes: new Uint32Array([0, 1, 1, 1244, 0, 0, 2, 3, 1244, 0, 0, 3, 5, 64, 0, 1, 4, 7, 0, 0]),
    strings: ['', 'system / NativeContext', 'system / NativeContext / vscode-file://vscode-app', 'system / Context', 'NativeContext'],
  }
  expect(getNativeContextCount(snapshot)).toBe(2)
})
