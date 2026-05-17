import { expect, test } from '@jest/globals'
import * as IsExpiredTokenErrorResponse from '../src/parts/IsExpiredTokenErrorResponse/IsExpiredTokenErrorResponse.ts'

test('isExpiredTokenErrorResponse - detects expired token responses', () => {
  expect(
    IsExpiredTokenErrorResponse.isExpiredTokenErrorResponse({
      body: 'IDE token expired: unauthorized: token expired\n',
      statusCode: 401,
    }),
  ).toBe(true)
})

test('isExpiredTokenErrorResponse - detects invalid token auth responses', () => {
  expect(
    IsExpiredTokenErrorResponse.isExpiredTokenErrorResponse({
      body: 'IDE authentication failed: unauthorized: invalid token: cannot validate HMAC\n',
      statusCode: 401,
    }),
  ).toBe(true)
})

test('isExpiredTokenErrorResponse - ignores unrelated 401 responses', () => {
  expect(
    IsExpiredTokenErrorResponse.isExpiredTokenErrorResponse({
      body: 'Unauthorized',
      statusCode: 401,
    }),
  ).toBe(false)
})
