import { expect, test } from '@jest/globals'
import * as MeasureLargestArrayCount from '../src/parts/MeasureLargestArrayCount/MeasureLargestArrayCount.ts'

test('largest array count does not report a leak when no arrays grew', () => {
  expect(MeasureLargestArrayCount.isLeak([])).toBe(false)
})

test('largest array count reports a leak when an array grew', () => {
  expect(
    MeasureLargestArrayCount.isLeak([
      {
        delta: 1,
        length: 2,
        name: 'bufferedEvents',
      },
    ]),
  ).toBe(true)
})
