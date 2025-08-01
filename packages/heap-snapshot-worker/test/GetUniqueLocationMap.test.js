import { expect, test } from '@jest/globals'
import { getUniqueLocationMap } from '../src/parts/GetUniqueLocationMap/GetUniqueLocationMap.js'

test('getUniqueLocationMap - merge duplicates', () => {
  const locations = new Uint32Array([1, 2, 3, 4, 1, 2, 3, 4])
  expect(getUniqueLocationMap(locations)).toEqual({
    '2:3:4': {
      count: 1,
      index: 0,
    },
  })
})
