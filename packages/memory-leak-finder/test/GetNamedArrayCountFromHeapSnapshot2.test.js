import * as GetNamedArrayCountFromHeapSnapshot2 from '../src/parts/GetNamedArrayCountFromHeapSnapshot2/GetNamedArrayCountFromHeapSnapshot2.js'
import { test, expect } from '@jest/globals'

test.skip('getNamedArrayCountFromHeapSnapshot2', () => {
  const heapsnapshot = {
    snapshot: {
      meta: {
        node_types: [
          [
            'hidden',
            'array',
            'string',
            'object',
            'code',
            'closure',
            'regexp',
            'number',
            'native',
            'synthetic',
            'concatenated string',
            'sliced string',
            'symbol',
            'bigint',
            'object shape',
          ],
        ],
      },
    },
    // prettier-ignore
    nodes: [
      5, 0, 0, 0, 1, 0, 0, // closure
      1, 2, 0, 0, 0, 0, 0, // array
    ],
    edges: [0, 1, 7],
    strings: ['a', 'b', 'c'],
  }
  expect(GetNamedArrayCountFromHeapSnapshot2.getNamedArrayCountFromHeapSnapshot(heapsnapshot)).toEqual({
    a: 1,
  })
})
