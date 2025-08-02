import { test, expect } from '@jest/globals'
import { pathToFileURL } from 'node:url'
import { computeVscodeNodeModulesCacheKey } from '../src/parts/ComputeVscodeNodeModulesCacheKey/ComputeVscodeNodeModulesCacheKey.js'

test('computeVscodeNodeModulesCacheKey - function exists and is callable', async () => {
  expect(typeof computeVscodeNodeModulesCacheKey).toBe('function')
})

test('computeVscodeNodeModulesCacheKey - returns a string', async () => {
  const result = await computeVscodeNodeModulesCacheKey(pathToFileURL('/nonexistent/path').href)
  expect(typeof result).toBe('string')
  expect(result.length).toBeGreaterThan(0)
})

test('computeVscodeNodeModulesCacheKey - handles errors gracefully', async () => {
  // Should not throw with invalid path
  await computeVscodeNodeModulesCacheKey(pathToFileURL('/nonexistent/path').href)
})
