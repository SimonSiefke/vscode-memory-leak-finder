import { expect, test } from '@jest/globals'
import { getEditContextCountFromHeapSnapshotInternal } from '../src/parts/GetEditContextCountFromHeapSnapshotInternal/GetEditContextCountFromHeapSnapshotInternal.js'
import { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('should count EditContext objects from heap snapshot', () => {
  // prettier-ignore
  const testData: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 1,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      3, 0, 200, 32, 0, 0, 0, // object with name index 0
    ]),
    edges: new Uint32Array([]),
    locations: new Uint32Array([]),
    strings: ['EditContext', ''],
  }
  const result = getEditContextCountFromHeapSnapshotInternal(testData)
  expect(result).toEqual(1)
})
