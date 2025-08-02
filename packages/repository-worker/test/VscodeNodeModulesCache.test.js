import { expect, test } from '@jest/globals'
import { setupNodeModulesFromCache } from '../src/parts/SetupNodeModulesFromCache/SetupNodeModulesFromCache.js'
import { cacheNodeModules } from '../src/parts/CacheNodeModules/CacheNodeModules.js'
import { cleanupNodeModules } from '../src/parts/CleanupNodeModules/CleanupNodeModules.js'

test('setupNodeModulesFromCache - function exists and is callable', async () => {
  expect(typeof setupNodeModulesFromCache).toBe('function')
})

test('setupNodeModulesFromCache - function signature is correct', async () => {
  const fn = setupNodeModulesFromCache
  expect(fn.length).toBe(1) // Should accept one parameter (repoPath)
})

test('cacheNodeModules - function exists and is callable', async () => {
  expect(typeof cacheNodeModules).toBe('function')
})

test('cacheNodeModules - function signature is correct', async () => {
  const fn = cacheNodeModules
  expect(fn.length).toBe(1) // Should accept one parameter (repoPath)
})

test('cleanupNodeModules - function exists and is callable', async () => {
  expect(typeof cleanupNodeModules).toBe('function')
})

test('cleanupNodeModules - function signature is correct', async () => {
  const fn = cleanupNodeModules
  expect(fn.length).toBe(1) // Should accept one parameter (repoPath)
})

test('functions handle errors gracefully', async () => {
  // These should not throw errors even with invalid paths
  const result1 = await setupNodeModulesFromCache('/nonexistent/path')
  expect(typeof result1).toBe('boolean')

  await cacheNodeModules('/nonexistent/path')
  // Should not throw

  cleanupNodeModules('/nonexistent/path')
  // Should not throw
})
