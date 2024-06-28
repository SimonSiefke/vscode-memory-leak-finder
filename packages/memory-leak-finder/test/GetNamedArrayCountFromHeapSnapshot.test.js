import * as GetNamedArrayCountFromHeapSnapshot from '../src/parts/GetNamedArrayCountFromHeapSnapshot/GetNamedArrayCountFromHeapSnapshot.js'

test('getNamedArrayCountFromHeapSnapshot', () => {
  const heapsnapshot = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array']],
      },
    },
    nodes: [1, 0, 0, 0, 0, 0, 0],
    strings: ['a'],
  }
  expect(GetNamedArrayCountFromHeapSnapshot.getNamedArrayCountFromHeapSnapshot(heapsnapshot)).toEqual({
    a: 1,
  })
})
