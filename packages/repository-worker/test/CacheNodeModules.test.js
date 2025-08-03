import { expect, test, jest } from '@jest/globals'

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

test('addNodeModulesToCache - function exists and is callable', async () => {
  const { addNodeModulesToCache } = await import('../src/parts/CacheNodeModules/CacheNodeModules.js')
  expect(typeof addNodeModulesToCache).toBe('function')
})
