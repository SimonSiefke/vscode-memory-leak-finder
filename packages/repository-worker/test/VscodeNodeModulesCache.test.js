import { expect, test } from '@jest/globals'
import { setupNodeModulesFromCache } from '../src/parts/SetupNodeModulesFromCache/SetupNodeModulesFromCache.js'
import { addNodeModulesToCache } from '../src/parts/CacheNodeModules/CacheNodeModules.js'
import { cleanupNodeModules } from '../src/parts/CleanupNodeModules/CleanupNodeModules.js'

test('setupNodeModulesFromCache - function exists and is callable', async () => {
  expect(typeof setupNodeModulesFromCache).toBe('function')
})

test('addNodeModulesToCache - function exists and is callable', async () => {
  expect(typeof addNodeModulesToCache).toBe('function')
})

test('cleanupNodeModules - function exists and is callable', async () => {
  expect(typeof cleanupNodeModules).toBe('function')
})

test('functions throw VError on errors', async () => {
  // These should throw VError with invalid paths
  await expect(addNodeModulesToCache('/nonexistent/path')).rejects.toThrow('Failed to cache node_modules')

  // cleanupNodeModules should not throw for non-existent paths, it just returns empty operations
  const result = await cleanupNodeModules('/nonexistent/path')
  expect(result).toBeUndefined()
})

test('setupNodeModulesFromCache returns false when no cache exists', async () => {
  // This should return false (not throw) when no cache exists
  const result = await setupNodeModulesFromCache('/nonexistent/path')
  expect(result).toBe(false)
})
