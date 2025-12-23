import { expect, test } from '@jest/globals'
import { isJwtToken } from '../src/parts/IsJwtToken/IsJwtToken.ts'

test('isJwtToken - returns true for valid JWT token', () => {
  const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  expect(isJwtToken(validToken)).toBe(true)
})

test('isJwtToken - returns false for non-string input', () => {
  expect(isJwtToken(null as any)).toBe(false)
  expect(isJwtToken(undefined as any)).toBe(false)
  expect(isJwtToken(123 as any)).toBe(false)
  expect(isJwtToken({} as any)).toBe(false)
})

test('isJwtToken - returns false for string with less than 3 parts', () => {
  expect(isJwtToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')).toBe(false)
  expect(isJwtToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ')).toBe(false)
})

test('isJwtToken - returns false for string with more than 3 parts', () => {
  expect(isJwtToken('part1.part2.part3.part4')).toBe(false)
})

test('isJwtToken - returns false for string that does not match JWT pattern', () => {
  expect(isJwtToken('not.a.jwt')).toBe(false)
  expect(isJwtToken('invalid.token.format')).toBe(false)
  expect(isJwtToken('abc.def.ghi')).toBe(false)
})

test('isJwtToken - returns true for JWT with different algorithms', () => {
  const hs256Token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgVDry6-M8Bi_5oXi8B2N6nc1g6Ry3kd0yBqN3Yk'
  const rs256Token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.test'
  expect(isJwtToken(hs256Token)).toBe(true)
  expect(isJwtToken(rs256Token)).toBe(true)
})

test('isJwtToken - returns true for JWT with base64url characters', () => {
  const tokenWithUnderscore = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.test_signature'
  const tokenWithDash = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.test-signature'
  expect(isJwtToken(tokenWithUnderscore)).toBe(true)
  expect(isJwtToken(tokenWithDash)).toBe(true)
})

