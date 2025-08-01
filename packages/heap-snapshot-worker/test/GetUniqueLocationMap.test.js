import { expect, test } from '@jest/globals'
import { getUniqueLocationMap } from '../src/parts/GetUniqueLocationMap/GetUniqueLocationMap.js'

test('getUniqueLocationMap - merge duplicates', () => {
  const locations = new Uint32Array([1, 2, 3, 4, 1, 2, 3, 4])
  expect(getUniqueLocationMap(locations, 4, 1, 2, 3)).toEqual({
    '23:4': {
      count: 2,
      index: 0,
    },
  })
})

test('getUniqueLocationMap - unique locations', () => {
  const locations = new Uint32Array([1, 2, 3, 4, 5, 6, 7, 8])
  expect(getUniqueLocationMap(locations, 4, 1, 2, 3)).toEqual({
    '23:4': {
      count: 1,
      index: 0,
    },
    '67:8': {
      count: 1,
      index: 1,
    },
  })
})
