import { test, expect } from '@jest/globals'
import * as ErrorCodes from '../src/parts/ErrorCodes/ErrorCodes.ts'
import * as IsIgnoredProcessKillError from '../src/parts/IsIgnoredProcessKillError/IsIgnoredProcessKillError.ts'

test('isIgnoredProcessKillError - ENOENT', () => {
  const error: { code: string } = { code: ErrorCodes.ENOENT }
  expect(IsIgnoredProcessKillError.isIgnoredProcessKillError(error)).toBe(true)
})

test('isIgnoredProcessKillError - ESRCH', () => {
  const error: { code: string } = { code: ErrorCodes.ESRCH }
  expect(IsIgnoredProcessKillError.isIgnoredProcessKillError(error)).toBe(true)
})

test('isIgnoredProcessKillError - EPERM', () => {
  const error: { code: string } = { code: ErrorCodes.EPERM }
  expect(IsIgnoredProcessKillError.isIgnoredProcessKillError(error)).toBe(true)
})

test('isIgnoredProcessKillError - other error code', () => {
  const error: { code: string } = { code: 'EACCES' }
  expect(IsIgnoredProcessKillError.isIgnoredProcessKillError(error)).toBe(false)
})

test('isIgnoredProcessKillError - error without code', () => {
  const error: { message: string } = { message: 'some error' }
  expect(IsIgnoredProcessKillError.isIgnoredProcessKillError(error)).toBe(false)
})

test('isIgnoredProcessKillError - null', () => {
  expect(IsIgnoredProcessKillError.isIgnoredProcessKillError(null)).toBe(false)
})

test('isIgnoredProcessKillError - undefined', () => {
  expect(IsIgnoredProcessKillError.isIgnoredProcessKillError(undefined)).toBe(false)
})

test('isIgnoredProcessKillError - string', () => {
  expect(IsIgnoredProcessKillError.isIgnoredProcessKillError('error')).toBe(false)
})

test('isIgnoredProcessKillError - number', () => {
  expect(IsIgnoredProcessKillError.isIgnoredProcessKillError(123)).toBe(false)
})
