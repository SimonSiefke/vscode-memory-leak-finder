import { expect, test } from '@jest/globals'
import * as CompareGlobalPropertyDifference from '../src/parts/CompareGlobalPropertyDifference/CompareGlobalPropertyDifference.ts'

test('returns sorted properties added to globalThis', () => {
  expect(
    CompareGlobalPropertyDifference.compareGlobalPropertyDifference(
      ['document', 'window'],
      ['window', 'leakedState', 'document', 'activeSession'],
    ),
  ).toEqual(['activeSession', 'leakedState'])
})

test('does not report removed global properties', () => {
  expect(
    CompareGlobalPropertyDifference.compareGlobalPropertyDifference(['document', 'temporary', 'window'], ['document', 'window']),
  ).toEqual([])
})
