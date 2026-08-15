import { expect, test } from '@jest/globals'
import { compareActiveAsyncResources } from '../src/parts/CompareActiveAsyncResources/CompareActiveAsyncResources.ts'

test('keeps resource groups that recur once per measured run', () => {
  const after = [
    { count: 3, stackTrace: ['at leak (test.js:1:1)'], type: 'Timeout' },
    { count: 1, stackTrace: ['at noise (test.js:2:1)'], type: 'PROMISE' },
  ]
  expect(compareActiveAsyncResources(undefined, after, { runs: 3 })).toEqual({ isLeak: true, resources: [after[0]] })
})
