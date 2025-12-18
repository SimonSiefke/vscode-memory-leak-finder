import { expect, test } from '@jest/globals'
import { getWeakRefCountFromHeapSnapshotInternal } from '../src/parts/GetWeakRefCountFromHeapSnapshotInternal/GetWeakRefCountFromHeapSnapshotInternal.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('should count weak ref objects from heap snapshot', () => {
  // prettier-ignore
  const testData: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 6,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      3, 1, 100, 32, 0, 0, 0, // weak ref object 1 (type=3=object, name=1=WeakRef.prototype)
      3, 1, 101, 32, 0, 0, 0, // weak ref object 2 (type=3=object, name=1=WeakRef.prototype)
      3, 1, 1, 32, 0, 0, 0,   // weak ref object 3 (type=3=object, name=1=WeakRef.prototype)
      3, 1, 103, 32, 0, 0, 0, // weak ref object 4 (type=3=object, name=1=WeakRef.prototype)
      3, 1, 104, 32, 0, 0, 0, // weak ref object 5 (type=3=object, name=1=WeakRef.prototype)
      3, 1, 105, 32, 0, 0, 0, // weak ref object 6 (type=3=object, name=1=WeakRef.prototype)
    ]),
    edges: new Uint32Array([]),
    locations: new Uint32Array([]),
    strings: ['', 'WeakRef.prototype'],
  }
  const result = getWeakRefCountFromHeapSnapshotInternal(testData)
  expect(result).toEqual(2)
})
