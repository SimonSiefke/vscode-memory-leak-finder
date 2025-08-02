import { test, expect } from '@jest/globals'
import * as ResolveCommitHash from '../src/parts/ResolveCommitHash/ResolveCommitHash.js'

const VSCODE_REPO_URL = 'https://github.com/microsoft/vscode.git'

test('resolveCommitHash should resolve main branch to actual commit hash', async () => {
  const result = await ResolveCommitHash.resolveCommitHash(VSCODE_REPO_URL, 'main')

  // Should be a 40-character hex string
  expect(result).toMatch(/^[a-f0-9]{40}$/i)
  expect(result.length).toBe(40)
}, 10000) // 10 second timeout for network call

test('resolveCommitHash should return full commit hash as is', async () => {
  const fullCommitHash = 'a1b2c3d4e5f6789012345678901234567890abcd'
  const result = await ResolveCommitHash.resolveCommitHash(VSCODE_REPO_URL, fullCommitHash)
  expect(result).toBe(fullCommitHash)
})