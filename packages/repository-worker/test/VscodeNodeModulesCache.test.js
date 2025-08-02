import { expect, test } from '@jest/globals'
import { setupNodeModulesFromCache } from '../src/parts/SetupNodeModulesFromCache/SetupNodeModulesFromCache.js'
import { addNodeModulesToCache } from '../src/parts/CacheNodeModules/CacheNodeModules.js'

test('setupNodeModulesFromCache - function exists and is callable', async () => {
  expect(typeof setupNodeModulesFromCache).toBe('function')
})

test('addNodeModulesToCache - function exists and is callable', async () => {
  expect(typeof addNodeModulesToCache).toBe('function')
})

test('setupNodeModulesFromCache returns false when no cache exists', async () => {
  // This should return false (not throw) when no cache exists
  const result = await setupNodeModulesFromCache('/nonexistent/path', 'test-commit', '/test/cache')
  expect(result).toBe(false)
})
