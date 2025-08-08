import { expect, test } from '@jest/globals'
import { getV8EventListenerCountFromHeapSnapshotInternal } from '../src/parts/GetV8EventListenerCountFromHeapSnapshotInternal/GetV8EventListenerCountFromHeapSnapshotInternal.js'
import { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('should count V8EventListener objects from heap snapshot', () => {
  // prettier-ignore
  const testData: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 1,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      8, 1, 1, 32, 0, 0, // native object with name V8EventListener
    ]),
    edges: new Uint32Array([]),
    locations: new Uint32Array([]),
    strings: ['', 'V8EventListener'],
  }
  const result = getV8EventListenerCountFromHeapSnapshotInternal(testData)
  expect(result).toEqual(1) // 1 V8EventListener object
})
