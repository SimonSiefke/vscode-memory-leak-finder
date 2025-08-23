import { test, expect } from '@jest/globals'
import * as GetFunctionObjectIds from '../src/parts/GetFunctionObjectIds/GetFunctionObjectIds.ts'

test('getFunctionObjectIds', () => {
  const descriptors = [
    {
      objectId: 'test-123',
    },
  ]
  expect(GetFunctionObjectIds.getFunctionObjectIds(descriptors)).toEqual(['test-123'])
})
