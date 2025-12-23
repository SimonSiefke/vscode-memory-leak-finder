import { expect, test } from '@jest/globals'
import { isExpirationProperty } from '../src/parts/IsExpirationProperty/IsExpirationProperty.ts'

test('isExpirationProperty - returns true for "expires"', () => {
  expect(isExpirationProperty('expires')).toBe(true)
})

test('isExpirationProperty - returns true for "expires" case insensitive', () => {
  expect(isExpirationProperty('EXPIRES')).toBe(true)
  expect(isExpirationProperty('Expires')).toBe(true)
  expect(isExpirationProperty('ExPiReS')).toBe(true)
})

test('isExpirationProperty - returns true for "expires_at"', () => {
  expect(isExpirationProperty('expires_at')).toBe(true)
  expect(isExpirationProperty('EXPIRES_AT')).toBe(true)
})

test('isExpirationProperty - returns true for "expiresAt"', () => {
  expect(isExpirationProperty('expiresAt')).toBe(true)
  expect(isExpirationProperty('expiresAt')).toBe(true)
})

test('isExpirationProperty - returns true for "expiry"', () => {
  expect(isExpirationProperty('expiry')).toBe(true)
  expect(isExpirationProperty('EXPIRY')).toBe(true)
})

test('isExpirationProperty - returns true for "expiry_at"', () => {
  expect(isExpirationProperty('expiry_at')).toBe(true)
  expect(isExpirationProperty('EXPIRY_AT')).toBe(true)
})

test('isExpirationProperty - returns true for "expiryAt"', () => {
  expect(isExpirationProperty('expiryAt')).toBe(true)
  expect(isExpirationProperty('EXPIRYAT')).toBe(true)
})

test('isExpirationProperty - returns true for "exp"', () => {
  expect(isExpirationProperty('exp')).toBe(true)
  expect(isExpirationProperty('EXP')).toBe(true)
})

test('isExpirationProperty - returns true for "expiration"', () => {
  expect(isExpirationProperty('expiration')).toBe(true)
  expect(isExpirationProperty('EXPIRATION')).toBe(true)
})

test('isExpirationProperty - returns true for "expiration_at"', () => {
  expect(isExpirationProperty('expiration_at')).toBe(true)
  expect(isExpirationProperty('EXPIRATION_AT')).toBe(true)
})

test('isExpirationProperty - returns true for "expirationAt"', () => {
  expect(isExpirationProperty('expirationAt')).toBe(true)
  expect(isExpirationProperty('EXPIRATIONAT')).toBe(true)
})

test('isExpirationProperty - returns true for "token_expires"', () => {
  expect(isExpirationProperty('token_expires')).toBe(true)
  expect(isExpirationProperty('TOKEN_EXPIRES')).toBe(true)
})

test('isExpirationProperty - returns true for "token_expires_at"', () => {
  expect(isExpirationProperty('token_expires_at')).toBe(true)
  expect(isExpirationProperty('TOKEN_EXPIRES_AT')).toBe(true)
})

test('isExpirationProperty - returns true for "access_token_expires"', () => {
  expect(isExpirationProperty('access_token_expires')).toBe(true)
  expect(isExpirationProperty('ACCESS_TOKEN_EXPIRES')).toBe(true)
})

test('isExpirationProperty - returns true for "access_token_expires_at"', () => {
  expect(isExpirationProperty('access_token_expires_at')).toBe(true)
  expect(isExpirationProperty('ACCESS_TOKEN_EXPIRES_AT')).toBe(true)
})

test('isExpirationProperty - returns true for "refresh_token_expires"', () => {
  expect(isExpirationProperty('refresh_token_expires')).toBe(true)
  expect(isExpirationProperty('REFRESH_TOKEN_EXPIRES')).toBe(true)
})

test('isExpirationProperty - returns true for "refresh_token_expires_at"', () => {
  expect(isExpirationProperty('refresh_token_expires_at')).toBe(true)
  expect(isExpirationProperty('REFRESH_TOKEN_EXPIRES_AT')).toBe(true)
})

test('isExpirationProperty - returns false for non-expiration properties', () => {
  expect(isExpirationProperty('name')).toBe(false)
  expect(isExpirationProperty('email')).toBe(false)
  expect(isExpirationProperty('userId')).toBe(false)
  expect(isExpirationProperty('token')).toBe(false)
  expect(isExpirationProperty('access_token')).toBe(false)
  expect(isExpirationProperty('refresh_token')).toBe(false)
  expect(isExpirationProperty('created_at')).toBe(false)
  expect(isExpirationProperty('updated_at')).toBe(false)
})

test('isExpirationProperty - returns true for "expire" (singular)', () => {
  expect(isExpirationProperty('expire')).toBe(true)
  expect(isExpirationProperty('EXPIRE')).toBe(true)
})

