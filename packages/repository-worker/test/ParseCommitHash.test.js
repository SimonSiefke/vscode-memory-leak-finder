import { expect, test, jest } from '@jest/globals'

const mockIsFullCommitHash = jest.fn()

jest.unstable_mockModule('../src/parts/IsFullCommitHash/IsFullCommitHash.js', () => ({
  isFullCommitHash: mockIsFullCommitHash,
}))

const { parseCommitHash } = await import('../src/parts/ParseCommitHash/ParseCommitHash.js')

test('parseCommitHash returns valid commit hash', () => {
  const stdout = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0\n'
  const commitRef = 'main'

  mockIsFullCommitHash.mockReturnValue(true)

  const result = parseCommitHash(stdout, commitRef)

  expect(result).toBe('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0')
  expect(mockIsFullCommitHash).toHaveBeenCalledWith('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0')
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

  mockIsFullCommitHash.mockReturnValue(false)

  expect(() => parseCommitHash(stdout, commitRef)).toThrow('Invalid commit hash resolved: invalid-hash')
})

test('parseCommitHash handles multiple lines and takes first line', () => {
  const stdout = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0\nsecond-line\nthird-line'
  const commitRef = 'main'

  mockIsFullCommitHash.mockReturnValue(true)

  const result = parseCommitHash(stdout, commitRef)

  expect(result).toBe('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0')
  expect(mockIsFullCommitHash).toHaveBeenCalledWith('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0')
}) 