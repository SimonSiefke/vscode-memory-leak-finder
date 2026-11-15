import { expect, test } from '@jest/globals'
import { toNumericGitHubId } from '../src/parts/ToNumericGitHubId/ToNumericGitHubId.ts'

test.each([42, 42n, Number.MAX_SAFE_INTEGER, BigInt(Number.MAX_SAFE_INTEGER)])('preserves GitHub ID %s', (id) => {
  expect(toNumericGitHubId(id)).toBe(Number(id))
})

test.each([9007199254740993n, Number.MAX_SAFE_INTEGER + 1])('rejects GitHub ID %s without rounding it', (id) => {
  expect(() => toNumericGitHubId(id)).toThrow('GitHub ID exceeds the safe integer range')
})
