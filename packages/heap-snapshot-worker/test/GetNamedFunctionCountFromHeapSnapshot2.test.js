import { expect, test } from '@jest/globals'
import { getNamedFunctionCountFromHeapSnapshot2 } from '../src/parts/GetNamedFunctionCountFromHeapSnapshot2/GetNamedFunctionCountFromHeapSnapshot2.js'

test('getNamedFunctionCountFromHeapSnapshot2 - merge duplicates', () => {
  const locations = new Uint32Array([1, 2, 3, 4, 1, 2, 3, 4])
  expect(getNamedFunctionCountFromHeapSnapshot2(locations)).toEqual(new Uint32Array([0, 0, 0, 1]))
})
