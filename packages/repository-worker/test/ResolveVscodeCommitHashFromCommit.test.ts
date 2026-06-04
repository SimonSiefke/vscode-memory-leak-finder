import { beforeEach, expect, jest, test } from '@jest/globals'

const mockResolveCommitHash = jest.fn(async () => ({
  commitHash: '0123456789abcdef0123456789abcdef01234567',
  owner: 'microsoft',
}))

jest.unstable_mockModule('../src/parts/ResolveCommitHash/ResolveCommitHash.ts', () => ({
  resolveCommitHash: mockResolveCommitHash,
}))

const { resolveVscodeCommitHashFromCommit } =
  await import('../src/parts/ResolveVscodeCommitHashFromCommit/ResolveVscodeCommitHashFromCommit.ts')

beforeEach(() => {
  jest.clearAllMocks()
})

test('resolveVscodeCommitHashFromCommit returns the resolved commit hash', async () => {
  const result = await resolveVscodeCommitHashFromCommit('abc123', 'https://github.com/microsoft/vscode.git')

  expect(result).toBe('0123456789abcdef0123456789abcdef01234567')
  expect(mockResolveCommitHash.mock.calls).toEqual([['https://github.com/microsoft/vscode.git', 'abc123']])
})
