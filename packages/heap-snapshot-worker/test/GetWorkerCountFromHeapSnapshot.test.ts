import { expect, test } from '@jest/globals'
import { getWorkerCountFromHeapSnapshotInternal } from '../src/parts/GetWorkerCountFromHeapSnapshotInternal/GetWorkerCountFromHeapSnapshotInternal.ts'
import { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('should count worker objects from heap snapshot', () => {
  // prettier-ignore
  const testData: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 3,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      3, 1, 100, 32, 0, 0, 0, // worker object 1 (type=3=object, name=1=Worker.prototype)
      3, 1, 101, 32, 0, 0, 0, // worker object 2 (type=3=object, name=1=Worker.prototype)
      3, 1, 102, 32, 0, 0, 0, // worker object 3 (type=3=object, name=1=Worker.prototype)
    ]),
    edges: new Uint32Array([]),
    locations: new Uint32Array([]),
    strings: ['', 'Worker.prototype'],
  }
  const result = getWorkerCountFromHeapSnapshotInternal(testData)
  expect(result).toEqual(3)
})
