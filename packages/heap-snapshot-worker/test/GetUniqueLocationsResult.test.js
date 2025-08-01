import { expect, test } from '@jest/globals'
import { getUniqueLocationMap } from '../src/parts/GetUniqueLocationMap/GetUniqueLocationMap.js'
import { getUniqueLocationsResult } from '../src/parts/GetUniqueLocationsResult/GetUniqueLocationsResult.js'

test('getUniqueLocationMap - merge duplicates', () => {
  const locations = new Uint32Array([1, 2, 3, 4, 1, 2, 3, 4])
  const locationMap = getUniqueLocationMap(locations)
  const result = getUniqueLocationsResult(locationMap, locations)
  expect(result).toEqual(new Uint32Array([1, 2, 3, 4, 2]))
})
