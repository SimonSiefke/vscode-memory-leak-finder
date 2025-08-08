import { expect, test } from '@jest/globals'
import { getStringsInternal } from '../src/parts/GetStringsInternal/GetStringsInternal.js'
import { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('getStrings - extracts strings array from heap snapshot file', async () => {
  const heapsnapshot: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object']],
      node_fields: ['type', 'name', 'id'],
      edge_fields: [],
      edge_types: [],
      location_fields: [],
    },
    node_count: 1,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([0, 0, 0]),
    edges: new Uint32Array([]),
    strings: ['first string', 'second string', '(heap number)'],
    locations: new Uint32Array([]),
  }
  const strings = getStringsInternal(heapsnapshot)
  expect(strings).toEqual(['first string', 'second string', '(heap number)'])
})

test('getStrings - handles empty strings array', async () => {
  const heapsnapshot: Snapshot = {
    meta: {
      node_types: [['hidden']],
      node_fields: ['type', 'name', 'id'],
      edge_fields: [],
      edge_types: [[]],
      location_fields: [],
    },
    extra_native_bytes: 0,
    node_count: 1,
    edge_count: 0,
    nodes: new Uint32Array([0, 0, 0]),
    edges: new Uint32Array([]),
    strings: [],
    locations: new Uint32Array([]),
  }

  const strings = getStringsInternal(heapsnapshot)

  expect(strings).toEqual([])
})
