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

test('functions handle errors gracefully', async () => {
  // These should not throw errors even with invalid paths
  const result1 = await setupNodeModulesFromCache('/nonexistent/path')
  expect(typeof result1).toBe('boolean')

  await addNodeModulesToCache('/nonexistent/path')
  // Should not throw

  cleanupNodeModules('/nonexistent/path')
  // Should not throw
})
