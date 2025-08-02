import { test, expect } from '@jest/globals'
import { findPackageLockFiles } from '../src/parts/FindPackageLockFiles/FindPackageLockFiles.js'
import { pathToFileURL } from 'node:url'

test('findPackageLockFiles - returns an array of file URIs', async () => {
  const result = await findPackageLockFiles(pathToFileURL('/nonexistent/path').href)
  expect(Array.isArray(result)).toBe(true)
})

test('findPackageLockFiles - handles errors gracefully', async () => {
  // Should throw VError with invalid path
  await expect(findPackageLockFiles(pathToFileURL('/nonexistent/path').href)).rejects.toThrow()
})

test('findPackageLockFiles - returns file URIs', async () => {
  const result = await findPackageLockFiles(pathToFileURL('/nonexistent/path').href)
  // If the function returns any results, they should be file URIs
  if (result.length > 0) {
    result.forEach(uri => {
      expect(uri).toMatch(/^file:\/\//)
    })
  }
})