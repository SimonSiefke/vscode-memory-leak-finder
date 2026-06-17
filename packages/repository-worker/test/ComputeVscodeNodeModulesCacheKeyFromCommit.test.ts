import { beforeEach, expect, jest, test } from '@jest/globals'

const mockCheckoutVscodeLockfilesAtCommit = jest.fn(async () => '/tmp/vscode-node-modules-cache-key-123')
const mockComputeVscodeNodeModulesCacheKey = jest.fn(async () => 'cache-key')
const mockResolveCommitHash = jest.fn(async () => ({
  commitHash: '0123456789abcdef0123456789abcdef01234567',
  owner: 'microsoft',
}))
const mockRm = jest.fn(async () => undefined)
const mockVerboseLogWrite = jest.fn(async () => undefined)

jest.unstable_mockModule('../src/parts/CheckoutVscodeLockfilesAtCommit/CheckoutVscodeLockfilesAtCommit.ts', () => ({
  checkoutVscodeLockfilesAtCommit: mockCheckoutVscodeLockfilesAtCommit,
}))

jest.unstable_mockModule('../src/parts/ComputeVscodeNodeModulesCacheKey/ComputeVscodeNodeModulesCacheKey.ts', () => ({
  computeVscodeNodeModulesCacheKey: mockComputeVscodeNodeModulesCacheKey,
}))

jest.unstable_mockModule('node:fs/promises', () => ({
  rm: mockRm,
}))

jest.unstable_mockModule('../src/parts/ResolveCommitHash/ResolveCommitHash.ts', () => ({
  resolveCommitHash: mockResolveCommitHash,
}))

jest.unstable_mockModule('../src/parts/VerboseLog/VerboseLog.ts', () => ({
  write: mockVerboseLogWrite,
}))

const { computeVscodeNodeModulesCacheKeyFromCommit } =
  await import('../src/parts/ComputeVscodeNodeModulesCacheKeyFromCommit/ComputeVscodeNodeModulesCacheKeyFromCommit.ts')

beforeEach(() => {
  jest.clearAllMocks()
  mockResolveCommitHash.mockImplementation(async () => ({
    commitHash: '0123456789abcdef0123456789abcdef01234567',
    owner: 'microsoft',
  }))
  mockComputeVscodeNodeModulesCacheKey.mockImplementation(async () => 'cache-key')
})

test('computeVscodeNodeModulesCacheKeyFromCommit - clones missing repository and computes cache key', async () => {
  const result = await computeVscodeNodeModulesCacheKeyFromCommit('abc123', 'https://github.com/microsoft/vscode.git')

  expect(result).toBe('cache-key')
  expect(mockCheckoutVscodeLockfilesAtCommit.mock.calls).toEqual([
    ['https://github.com/microsoft/vscode.git', '0123456789abcdef0123456789abcdef01234567', false],
  ])
  expect(mockComputeVscodeNodeModulesCacheKey.mock.calls).toEqual([['/tmp/vscode-node-modules-cache-key-123']])
  expect(mockRm.mock.calls).toEqual([['/tmp/vscode-node-modules-cache-key-123', { force: true, recursive: true }]])
})

test('computeVscodeNodeModulesCacheKeyFromCommit - uses fork owner when checking out lockfiles', async () => {
  mockResolveCommitHash.mockImplementation(async () => ({
    commitHash: 'fedcba9876543210fedcba9876543210fedcba98',
    owner: 'test-user',
  }))

  await computeVscodeNodeModulesCacheKeyFromCommit('test-user/feature-branch', 'https://github.com/microsoft/vscode.git')

  expect(mockCheckoutVscodeLockfilesAtCommit.mock.calls).toEqual([
    ['https://github.com/test-user/vscode.git', 'fedcba9876543210fedcba9876543210fedcba98', false],
  ])
})

test('computeVscodeNodeModulesCacheKeyFromCommit - removes the temporary checkout when hashing fails', async () => {
  mockComputeVscodeNodeModulesCacheKey.mockImplementationOnce(async () => {
    throw new Error('failed to hash lockfiles')
  })

  await expect(computeVscodeNodeModulesCacheKeyFromCommit('abc123', 'https://github.com/microsoft/vscode.git')).rejects.toThrow(
    'failed to hash lockfiles',
  )

  expect(mockRm.mock.calls).toEqual([['/tmp/vscode-node-modules-cache-key-123', { force: true, recursive: true }]])
})

test('computeVscodeNodeModulesCacheKeyFromCommit - logs progress when verbose', async () => {
  await computeVscodeNodeModulesCacheKeyFromCommit('abc123', 'https://github.com/microsoft/vscode.git', true)

  expect(mockCheckoutVscodeLockfilesAtCommit.mock.calls).toEqual([
    ['https://github.com/microsoft/vscode.git', '0123456789abcdef0123456789abcdef01234567', true],
  ])
  expect(mockVerboseLogWrite.mock.calls).toEqual([
    ["Resolving VS Code commit ref 'abc123'...\n"],
    ["Resolved commit ref 'abc123' to 0123456789abcdef0123456789abcdef01234567.\n"],
    ['Computing node modules cache key from lockfiles...\n'],
    ['Cleaning up temporary checkout...\n'],
  ])
})
