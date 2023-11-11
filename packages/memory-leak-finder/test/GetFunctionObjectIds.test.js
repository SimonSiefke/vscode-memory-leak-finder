import * as GetFunctionObjectIds from '../src/parts/GetFunctionObjectIds/GetFunctionObjectIds.js'

test('getFunctionObjectIds', () => {
  const descriptors = [
    {
      objectId: 'test-123',
    },
  ]
  expect(GetFunctionObjectIds.getFunctionObjectIds(descriptors)).toEqual(['test-123'])
})
