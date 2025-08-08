import { expect, test } from '@jest/globals'
import { getMapCountFromHeapSnapshotInternal } from '../src/parts/GetMapCountFromHeapSnapshotInternal/GetMapCountFromHeapSnapshotInternal.js'

test('getMapCountFromHeapSnapshot should return zero for no maps', () => {
  // prettier-ignore
  const testData = {
     snapshot: {
       meta: {
         node_types: [['hidden', 'array', 'string', 'object']],
         node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
         edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
         edge_fields: ['type', 'name_or_index', 'to_node'],
         location_fields: ['object_index', 'script_id', 'line', 'column'],
       },
       node_count: 1,
       edge_count: 0,
     },
     nodes: [
       0, 1, 100, 64, 0, 0, 0, // hidden object
     ],
     edges: [],
     locations: [],
     strings: ['', 'test'],
   }
  const result = getMapCountFromHeapSnapshotInternal(testData)
  expect(result).toEqual([])
})

// TODO add more tests
