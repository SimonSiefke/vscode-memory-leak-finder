import { expect, test, jest } from '@jest/globals'

// Mock the filesystem functions
const mockFindFiles = jest.fn()
const mockCopy = jest.fn()
const mockMakeDirectory = jest.fn()
const mockRemove = jest.fn()
const mockReadFileContent = jest.fn()
const mockPathExists = jest.fn()

jest.unstable_mockModule('../src/parts/Filesystem/Filesystem.js', () => ({
  findFiles: mockFindFiles,
  copy: mockCopy,
  makeDirectory: mockMakeDirectory,
  remove: mockRemove,
  readFileContent: mockReadFileContent,
  pathExists: mockPathExists,
}))

test('setupNodeModulesFromCache - function exists and is callable', async () => {
  const { setupNodeModulesFromCache } = await import('../src/parts/SetupNodeModulesFromCache/SetupNodeModulesFromCache.js')
  expect(typeof setupNodeModulesFromCache).toBe('function')
})

test('addNodeModulesToCache - function exists and is callable', async () => {
  const { addNodeModulesToCache } = await import('../src/parts/CacheNodeModules/CacheNodeModules.js')
  expect(typeof addNodeModulesToCache).toBe('function')
})

test('setupNodeModulesFromCache throws VError when no cache exists', async () => {
  // Mock findFiles to throw an error
  mockFindFiles.mockRejectedValue(new Error('ENOENT: no such file or directory'))

  const { setupNodeModulesFromCache } = await import('../src/parts/SetupNodeModulesFromCache/SetupNodeModulesFromCache.js')

  // This should throw VError when no cache exists
  await expect(setupNodeModulesFromCache('/nonexistent/path', 'test-commit', '/test/cache')).rejects.toThrow(
    'Failed to setup node_modules from cache',
  )
})
