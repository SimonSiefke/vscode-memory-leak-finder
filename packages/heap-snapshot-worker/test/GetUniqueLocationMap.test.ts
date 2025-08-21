import { test, expect } from '@jest/globals'
import { getUniqueLocationMap } from '../src/parts/GetUniqueLocationMap/GetUniqueLocationMap.ts'

test('getUniqueLocationMap - merge duplicates', () => {
  const locations = new Uint32Array([1, 2, 3, 4, 1, 2, 3, 4])
  expect(getUniqueLocationMap(locations, 4, 1, 2, 3)).toEqual({
    '2:3:4': {
      count: 2,
      index: 0,
    },
  })
})

test('getUniqueLocationMap - unique locations', () => {
  const locations = new Uint32Array([1, 2, 3, 4, 5, 6, 7, 8])
  expect(getUniqueLocationMap(locations, 4, 1, 2, 3)).toEqual({
    '2:3:4': {
      count: 1,
      index: 0,
    },
    '6:7:8': {
      count: 1,
      index: 1,
    },
  })
})

test('getUniqueLocationMap - empty locations', () => {
  const locations = new Uint32Array([])
  expect(getUniqueLocationMap(locations, 4, 1, 2, 3)).toEqual({})
})

test('getUniqueLocationMap - single location', () => {
  const locations = new Uint32Array([10, 1, 5, 8])
  expect(getUniqueLocationMap(locations, 4, 1, 2, 3)).toEqual({
    '1:5:8': {
      count: 1,
      index: 0,
    },
  })
})

test('getUniqueLocationMap - different field offsets', () => {
  const locations = new Uint32Array([1, 2, 3, 4, 5, 6, 7, 8])
  // scriptId at offset 0, line at offset 1, column at offset 2
  expect(getUniqueLocationMap(locations, 4, 0, 1, 2)).toEqual({
    '1:2:3': {
      count: 1,
      index: 0,
    },
    '5:6:7': {
      count: 1,
      index: 1,
    },
  })
})

test('getUniqueLocationMap - different items per location', () => {
  const locations = new Uint32Array([1, 2, 3, 4, 5, 6])
  // itemsPerLocation = 3, scriptId at offset 0, line at offset 1, column at offset 2
  expect(getUniqueLocationMap(locations, 3, 0, 1, 2)).toEqual({
    '1:2:3': {
      count: 1,
      index: 0,
    },
    '4:5:6': {
      count: 1,
      index: 1,
    },
  })
})

test('getUniqueLocationMap - multiple duplicates with different counts', () => {
  const locations = new Uint32Array([
    1,
    2,
    3,
    4, // location 1: scriptId=2, line=3, column=4
    1,
    2,
    3,
    4, // location 1 duplicate
    1,
    5,
    6,
    7, // location 2: scriptId=5, line=6, column=7
    1,
    2,
    3,
    4, // location 1 duplicate
    1,
    5,
    6,
    7, // location 2 duplicate
    1,
    5,
    6,
    7, // location 2 duplicate
  ])
  expect(getUniqueLocationMap(locations, 4, 1, 2, 3)).toEqual({
    '2:3:4': {
      count: 3,
      index: 0,
    },
    '5:6:7': {
      count: 3,
      index: 2,
    },
  })
})

test('getUniqueLocationMap - zero values', () => {
  const locations = new Uint32Array([0, 0, 0, 0, 0, 1, 2, 3])
  expect(getUniqueLocationMap(locations, 4, 1, 2, 3)).toEqual({
    '0:0:0': {
      count: 1,
      index: 0,
    },
    '1:2:3': {
      count: 1,
      index: 1,
    },
  })
})

test('getUniqueLocationMap - large values', () => {
  const locations = new Uint32Array([0, 1000, 2000, 3000, 0, 1000, 2000, 3000, 0, 9999, 8888, 7777])
  expect(getUniqueLocationMap(locations, 4, 1, 2, 3)).toEqual({
    '1000:2000:3000': {
      count: 2,
      index: 0,
    },
    '9999:8888:7777': {
      count: 1,
      index: 2,
    },
  })
})
