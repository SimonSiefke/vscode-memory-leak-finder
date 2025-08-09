import { expect, test } from '@jest/globals'
import { parseCommitHash } from '../src/parts/ParseCommitHash/ParseCommitHash.ts'

test('parseCommitHash returns valid commit hash', () => {
  const stdout = 'a1b2c3d4e5f6789012345678901234567890abcd\n'
  const commitRef = 'main'

  const result = parseCommitHash(stdout, commitRef)

  expect(result).toBe('a1b2c3d4e5f6789012345678901234567890abcd')
})

test('parseCommitHash throws error when no commit found', () => {
  const stdout = ''
  const commitRef = 'nonexistent'

  expect(() => parseCommitHash(stdout, commitRef)).toThrow(`No commit found for reference '${commitRef}'`)
})

test('parseCommitHash throws error when stdout is empty lines', () => {
  const stdout = '\n\n'
  const commitRef = 'main'

  expect(() => parseCommitHash(stdout, commitRef)).toThrow(`No commit found for reference '${commitRef}'`)
})

test('parseCommitHash throws error when commit hash is invalid', () => {
  const stdout = 'invalid-hash\n'
  const commitRef = 'main'

  expect(() => parseCommitHash(stdout, commitRef)).toThrow('Invalid commit hash resolved: invalid-hash')
})

test('parseCommitHash handles multiple lines and takes first line', () => {
  const stdout = 'a1b2c3d4e5f6789012345678901234567890abcd\nsecond-line\nthird-line'
  const commitRef = 'main'

  const result = parseCommitHash(stdout, commitRef)

  expect(result).toBe('a1b2c3d4e5f6789012345678901234567890abcd')
})
