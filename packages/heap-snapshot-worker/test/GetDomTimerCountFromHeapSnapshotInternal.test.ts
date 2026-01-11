import { expect, test } from '@jest/globals'
import { getDomTimerCountFromHeapSnapshotInternal } from '../src/parts/GetDomTimerCountFromHeapSnapshotInternal/GetDomTimerCountFromHeapSnapshotInternal.js'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('should count DOM timer objects from heap snapshot', () => {
  // prettier-ignore
  const testData: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 3,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      3, 1, 1, 32, 1, 0, 0, // DOMTimer object (type=object)
      8, 1, 2, 64, 1, 0, 0, // DOMTimer object (type=native)
      3, 3, 3, 48, 0, 0, 0, // regular object
    ]),
    edges: new Uint32Array([
      2, 6, 1, // property edge pointing to first object
      2, 7, 1, // property edge pointing to second object
    ]),
    locations: new Uint32Array([]),
    strings: ['', 'DOMTimer', 'regular', 'normal'],
  }
  const result = getDomTimerCountFromHeapSnapshotInternal(testData)
  expect(result).toEqual(2) // 2 DOMTimer objects
})

test('should return 0 for heap snapshot with no timer objects', () => {
  // prettier-ignore
  const testData: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      3, 1, 1, 32, 0, 0, 0, // regular object
      3, 2, 2, 64, 0, 0, 0, // another regular object
    ]),
    edges: new Uint32Array([]),
    locations: new Uint32Array([]),
    strings: ['', 'regular', 'normal'],
  }
  const result = getDomTimerCountFromHeapSnapshotInternal(testData)
  expect(result).toEqual(0) // No timer objects
})
