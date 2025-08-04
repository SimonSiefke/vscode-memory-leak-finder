import { pathToFileURL } from 'node:url'
import { test, expect } from '@jest/globals'
import { computeVscodeNodeModulesCacheKey } from '../src/parts/ComputeVscodeNodeModulesCacheKey/ComputeVscodeNodeModulesCacheKey.js'

test('computeVscodeNodeModulesCacheKey - returns a string', async () => {
  const result = await computeVscodeNodeModulesCacheKey(pathToFileURL('/nonexistent/path').href)
  expect(typeof result).toBe('string')
  expect(result.length).toBeGreaterThan(0)
})

test('computeVscodeNodeModulesCacheKey - handles errors gracefully', async () => {
  // Should not throw with invalid path
  await computeVscodeNodeModulesCacheKey(pathToFileURL('/nonexistent/path').href)
})
