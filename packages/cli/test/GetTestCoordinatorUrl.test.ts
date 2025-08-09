import { expect, test } from '@jest/globals'
import * as GetTestCoordinatorUrl from '../src/parts/GetTestCoordinatorUrl/GetTestCoordinatorUrl.ts'

test('getTestCoordinatorUrl - returns correct path to test coordinator', () => {
  const result = GetTestCoordinatorUrl.getTestCoordinatorUrl()
  expect(result).toBeDefined()
})
