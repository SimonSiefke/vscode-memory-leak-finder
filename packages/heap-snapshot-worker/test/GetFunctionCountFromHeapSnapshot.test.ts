import { expect, test } from '@jest/globals'
import { getFunctionCountFromHeapSnapshotInternal } from '../src/parts/GetFunctionCountFromHeapSnapshotInternal/GetFunctionCountFromHeapSnapshotInternal.js'
import { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('should count function/closure objects from heap snapshot', () => {
  // prettier-ignore
  const testData: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 3,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      4, 1, 1, 32, 0, 0, 0, // code object
      5, 2, 2, 64, 0, 0, 0, // closure object
      5, 3, 3, 48, 0, 0, 0, // closure object
    ]),
    edges: new Uint32Array([]),
    locations: new Uint32Array([]),
    strings: ['', 'function1', 'function2', 'function3'],
  }
  const result = getFunctionCountFromHeapSnapshotInternal(testData)
  expect(result).toEqual(2) // 2 closure objects
})
