import { test, expect } from '@jest/globals'
import { isFullCommitHash } from '../src/parts/IsFullCommitHash/IsFullCommitHash.js'

test('isFullCommitHash - returns true for valid 40-character hex hash', () => {
  const validHash = 'a1b2c3d4e5f6789012345678901234567890abcd'
  expect(isFullCommitHash(validHash)).toBe(true)
})

test('isFullCommitHash - returns true for valid hash with uppercase letters', () => {
  const validHash = 'A1B2C3D4E5F6789012345678901234567890ABCD'
  expect(isFullCommitHash(validHash)).toBe(true)
})

test('isFullCommitHash - returns true for valid hash with mixed case', () => {
  const validHash = 'a1B2c3D4e5F6789012345678901234567890aBcD'
  expect(isFullCommitHash(validHash)).toBe(true)
})

test('isFullCommitHash - returns false for short hash', () => {
  const shortHash = 'a1b2c3d4'
  expect(isFullCommitHash(shortHash)).toBe(false)
})

test('isFullCommitHash - returns false for long hash', () => {
  const longHash = 'a1b2c3d4e5f6789012345678901234567890abcd123'
  expect(isFullCommitHash(longHash)).toBe(false)
})

test('isFullCommitHash - returns false for hash with invalid characters', () => {
  const invalidHash = 'a1b2c3d4e5f6789012345678901234567890abcz'
  expect(isFullCommitHash(invalidHash)).toBe(false)
})

test('isFullCommitHash - returns false for hash with spaces', () => {
  const hashWithSpaces = 'a1b2c3d4e5f6789012345678901234567890ab c'
  expect(isFullCommitHash(hashWithSpaces)).toBe(false)
})

test('isFullCommitHash - returns false for hash with hyphens', () => {
  const hashWithHyphens = 'a1b2c3d4e5f6789012345678901234567890ab-c'
  expect(isFullCommitHash(hashWithHyphens)).toBe(false)
})

test('isFullCommitHash - returns false for empty string', () => {
  expect(isFullCommitHash('')).toBe(false)
})

test('isFullCommitHash - returns false for branch names', () => {
  expect(isFullCommitHash('main')).toBe(false)
  expect(isFullCommitHash('develop')).toBe(false)
  expect(isFullCommitHash('feature/new-feature')).toBe(false)
})

test('isFullCommitHash - returns false for tag names', () => {
  expect(isFullCommitHash('v1.0.0')).toBe(false)
  expect(isFullCommitHash('release-2023-12-01')).toBe(false)
})

test('isFullCommitHash - returns false for partial commit hashes', () => {
  expect(isFullCommitHash('a1b2c3')).toBe(false)
  expect(isFullCommitHash('a1b2c3d4e5f6')).toBe(false)
  expect(isFullCommitHash('a1b2c3d4e5f6789012345678901234567890ab')).toBe(false)
})

test('isFullCommitHash - returns true for real commit hashes', () => {
  // These are examples of real Git commit hashes (SHA1 - 40 characters)
  const realHashes = [
    'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3',
    '2aae6c35c94fcfb415dbe95f408b9ce91ee846ed',
    'da39a3ee5e6b4b0d3255bfef95601890afd80709',
  ]

  realHashes.forEach((hash) => {
    expect(isFullCommitHash(hash)).toBe(true)
  })
})

test('isFullCommitHash - returns false for SHA256 hashes', () => {
  // SHA256 hashes are 64 characters, not 40
  const sha256Hash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  expect(isFullCommitHash(sha256Hash)).toBe(false)
})
