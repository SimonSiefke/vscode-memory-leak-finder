import { expect, test } from '@jest/globals'
import { getStringsInternal } from '../src/parts/GetStringsInternal/GetStringsInternal.js'

test('getStrings - extracts strings array from heap snapshot file', async () => {
  const heapsnapshot = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object']],
        node_fields: ['type', 'name', 'id'],
      },
    },
    nodes: new Uint32Array([0, 0, 0]),
    edges: new Uint32Array([]),
    strings: ['first string', 'second string', '(heap number)'],
    locations: new Uint32Array([]),
  }
  const strings = getStringsInternal(heapsnapshot)
  expect(strings).toEqual(['first string', 'second string', '(heap number)'])
})

test('getStrings - handles empty strings array', async () => {
  const heapsnapshot = {
    snapshot: {
      meta: {
        node_types: [['hidden']],
        node_fields: ['type', 'name', 'id'],
      },
    },
    nodes: new Uint32Array([0, 0, 0]),
    edges: new Uint32Array([]),
    strings: [],
    locations: new Uint32Array([]),
  }

  const strings = getStringsInternal(heapsnapshot)

  expect(strings).toEqual([])
})
