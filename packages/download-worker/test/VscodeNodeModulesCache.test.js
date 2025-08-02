import { expect, test } from '@jest/globals'

test('setupNodeModulesFromCache - function exists and is callable', async () => {
  const { setupNodeModulesFromCache } = await import('../src/parts/VscodeNodeModulesCache/VscodeNodeModulesCache.js')
  expect(typeof setupNodeModulesFromCache).toBe('function')
})

test('setupNodeModulesFromCache - function signature is correct', async () => {
  const { setupNodeModulesFromCache } = await import('../src/parts/VscodeNodeModulesCache/VscodeNodeModulesCache.js')
  const fn = setupNodeModulesFromCache
  expect(fn.length).toBe(1) // Should accept one parameter (repoPath)
})

test('cacheNodeModules - function exists and is callable', async () => {
  const { cacheNodeModules } = await import('../src/parts/VscodeNodeModulesCache/VscodeNodeModulesCache.js')
  expect(typeof cacheNodeModules).toBe('function')
})

test('cacheNodeModules - function signature is correct', async () => {
  const { cacheNodeModules } = await import('../src/parts/VscodeNodeModulesCache/VscodeNodeModulesCache.js')
  const fn = cacheNodeModules
  expect(fn.length).toBe(1) // Should accept one parameter (repoPath)
})

test('cleanupNodeModules - function exists and is callable', async () => {
  const { cleanupNodeModules } = await import('../src/parts/VscodeNodeModulesCache/VscodeNodeModulesCache.js')
  expect(typeof cleanupNodeModules).toBe('function')
})

test('cleanupNodeModules - function signature is correct', async () => {
  const { cleanupNodeModules } = await import('../src/parts/VscodeNodeModulesCache/VscodeNodeModulesCache.js')
  const fn = cleanupNodeModules
  expect(fn.length).toBe(1) // Should accept one parameter (repoPath)
})

test('functions handle errors gracefully', async () => {
  const { setupNodeModulesFromCache, cacheNodeModules, cleanupNodeModules } = await import(
    '../src/parts/VscodeNodeModulesCache/VscodeNodeModulesCache.js'
  )

  // These should not throw errors even with invalid paths
  const result1 = await setupNodeModulesFromCache('/nonexistent/path')
  expect(typeof result1).toBe('boolean')

  await cacheNodeModules('/nonexistent/path')
  // Should not throw

  cleanupNodeModules('/nonexistent/path')
  // Should not throw
})
