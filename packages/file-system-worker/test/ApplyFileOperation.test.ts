import { test, expect, jest, beforeEach } from '@jest/globals'

const mockCopy = jest.fn()
const mockMakeDirectory = jest.fn()
const mockRemove = jest.fn()

jest.unstable_mockModule('../src/parts/Filesystem/Filesystem.ts', () => ({
  copy: mockCopy,
  makeDirectory: mockMakeDirectory,
  remove: mockRemove,
  writeFile: jest.fn(),
}))

let applyFileOperationModule

beforeEach(async () => {
  // Reset all mocks
  jest.clearAllMocks()

  // Import the module after mocking
  applyFileOperationModule = await import('../src/parts/ApplyFileOperation/ApplyFileOperation.ts')
})

test('applyFileOperation - applies copy operation', async () => {
  mockCopy.mockReturnValue(undefined)

  const operation = {
    type: 'copy',
    from: '/source/file.txt',
    to: '/dest/file.txt',
  }

  await applyFileOperationModule.applyFileOperation(operation)

  expect(mockCopy).toHaveBeenCalledWith('/source/file.txt', '/dest/file.txt', { recursive: true })
  expect(mockCopy).toHaveBeenCalledTimes(1)
})

test('applyFileOperation - applies mkdir operation', async () => {
  mockMakeDirectory.mockReturnValue(undefined)

  const operation = {
    type: 'mkdir',
    path: '/path/to/directory',
  }

  await applyFileOperationModule.applyFileOperation(operation)

  expect(mockMakeDirectory).toHaveBeenCalledWith('/path/to/directory', { recursive: true })
  expect(mockMakeDirectory).toHaveBeenCalledTimes(1)
})

test('applyFileOperation - applies remove operation', async () => {
  mockRemove.mockReturnValue(undefined)

  const operation = {
    type: 'remove',
    from: '/path/to/file.txt',
  }

  await applyFileOperationModule.applyFileOperation(operation)

  expect(mockRemove).toHaveBeenCalledWith('/path/to/file.txt', { recursive: true })
  expect(mockRemove).toHaveBeenCalledTimes(1)
})

test('applyFileOperation - handles copy operation error', async () => {
  const error = new Error('Copy failed')
  mockCopy.mockImplementation(() => {
    throw error
  })

  const operation = {
    type: 'copy',
    from: '/source/file.txt',
    to: '/dest/file.txt',
  }

  await expect(applyFileOperationModule.applyFileOperation(operation)).rejects.toThrow('Failed to apply file operation copy')
})

test('applyFileOperation - handles mkdir operation error', async () => {
  const error = new Error('Directory creation failed')
  mockMakeDirectory.mockImplementation(() => {
    throw error
  })

  const operation = {
    type: 'mkdir',
    path: '/path/to/directory',
  }

  await expect(applyFileOperationModule.applyFileOperation(operation)).rejects.toThrow('Failed to apply file operation mkdir')
})

test('applyFileOperation - handles remove operation error', async () => {
  const error = new Error('Remove failed')
  mockRemove.mockImplementation(() => {
    throw error
  })

  const operation = {
    type: 'remove',
    from: '/path/to/file.txt',
  }

  await expect(applyFileOperationModule.applyFileOperation(operation)).rejects.toThrow('Failed to apply file operation remove')
})
