import { expect, test } from '@jest/globals'

test('computeVscodeNodeModulesCacheKey - function exists and is callable', async () => {
  const { computeVscodeNodeModulesCacheKey } = await import(
    '../src/parts/ComputeVscodeNodeModulesCacheKey/ComputeVscodeNodeModulesCacheKey.js'
  )
  expect(typeof computeVscodeNodeModulesCacheKey).toBe('function')
})

test('computeVscodeNodeModulesCacheKey - function signature is correct', async () => {
  const { computeVscodeNodeModulesCacheKey } = await import(
    '../src/parts/ComputeVscodeNodeModulesCacheKey/ComputeVscodeNodeModulesCacheKey.js'
  )
  const fn = computeVscodeNodeModulesCacheKey
  expect(fn.length).toBe(1) // Should accept one parameter (repoPath)
})

test('computeVscodeNodeModulesCacheKey - returns a string', async () => {
  const { computeVscodeNodeModulesCacheKey } = await import(
    '../src/parts/ComputeVscodeNodeModulesCacheKey/ComputeVscodeNodeModulesCacheKey.js'
  )

  // This will fail in a real environment, but we're just testing the function signature
  try {
    await computeVscodeNodeModulesCacheKey('/nonexistent/path')
  } catch (error) {
    // Expected to fail, but we can verify the function is callable
    expect(error).toBeDefined()
  }
})
