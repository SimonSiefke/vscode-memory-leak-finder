import * as GetNamedArrayCountFromHeapSnapshot from '../src/parts/GetNamedArrayCountFromHeapSnapshot/GetNamedArrayCountFromHeapSnapshot.js'
import {test, expect} from '@jest/globals'

test.skip('getNamedArrayCountFromHeapSnapshot', () => {
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
      1, 1, 0, 0, 0, 0, 0, // array
    ],
    edges: [],
    strings: ['a', 'b'],
  }
  expect(GetNamedArrayCountFromHeapSnapshot.getNamedArrayCountFromHeapSnapshot(heapsnapshot)).toEqual({
    a: 1,
  })
})
