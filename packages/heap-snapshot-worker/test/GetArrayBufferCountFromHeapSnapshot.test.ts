import { expect, test } from '@jest/globals'
import { getArrayBufferCountFromHeapSnapshotInternal } from '../src/parts/GetArrayBufferCountFromHeapSnapshotInternal/GetArrayBufferCountFromHeapSnapshotInternal.js'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

// TODO
test.skip('should count array buffer count objects from heap snapshot', () => {
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
    extra_native_bytes:0,
    nodes: new Uint32Array([
      4, 1, 200, 32, 0, 0, 0, // regexp object
    ]),
    edges: new Uint32Array([]),
    locations: new Uint32Array([]),
    strings: ['', '/test/gi'],
  }
  const result = getArrayBufferCountFromHeapSnapshotInternal(testData)
  expect(result).toEqual(1)
})
