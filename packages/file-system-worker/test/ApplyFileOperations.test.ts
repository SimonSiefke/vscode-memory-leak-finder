import { beforeEach, expect, jest, test } from '@jest/globals'

const mockCopy = jest.fn()
const mockMakeDirectory = jest.fn()
const mockRemove = jest.fn()

jest.unstable_mockModule('../src/parts/Filesystem/Filesystem.ts', () => ({
  copy: mockCopy,
  makeDirectory: mockMakeDirectory,
  remove: mockRemove,
}))

let applyFileOperationsModule

beforeEach(async () => {
  // Reset all mocks
  jest.clearAllMocks()

  // Import the module after mocking
  applyFileOperationsModule = await import('../src/parts/ApplyFileOperations/ApplyFileOperations.ts')
})

test('applyFileOperations handles empty array gracefully', async () => {
  // Should not throw with empty array
  await applyFileOperationsModule.applyFileOperations([])

  // Should not call any filesystem functions
  expect(mockCopy).not.toHaveBeenCalled()
  expect(mockMakeDirectory).not.toHaveBeenCalled()
  expect(mockRemove).not.toHaveBeenCalled()
})

test('applyFileOperations - applies copy operation', async () => {
  mockCopy.mockReturnValue(undefined)

  const operations = [
    {
      type: 'copy',
      from: '/source/file.txt',
      to: '/dest/file.txt',
    },
  ]

  await applyFileOperationsModule.applyFileOperations(operations)

  expect(mockCopy).toHaveBeenCalledWith('/source/file.txt', '/dest/file.txt')
  expect(mockCopy).toHaveBeenCalledTimes(1)
})

test('applyFileOperations - applies mkdir operation', async () => {
  mockMakeDirectory.mockReturnValue(undefined)

  const operations = [
    {
      type: 'mkdir',
      path: '/path/to/directory',
    },
  ]

  await applyFileOperationsModule.applyFileOperations(operations)

  expect(mockMakeDirectory).toHaveBeenCalledWith('/path/to/directory')
  expect(mockMakeDirectory).toHaveBeenCalledTimes(1)
})

test('applyFileOperations - applies remove operation', async () => {
  mockRemove.mockReturnValue(undefined)

  const operations = [
    {
      type: 'remove',
      from: '/path/to/file.txt',
    },
  ]

  await applyFileOperationsModule.applyFileOperations(operations)

  expect(mockRemove).toHaveBeenCalledWith('/path/to/file.txt')
  expect(mockRemove).toHaveBeenCalledTimes(1)
})

test('applyFileOperations - applies multiple operations in sequence', async () => {
  mockCopy.mockReturnValue(undefined)
  mockMakeDirectory.mockReturnValue(undefined)
  mockRemove.mockReturnValue(undefined)

  const operations = [
    {
      type: 'mkdir',
      path: '/path/to/directory',
    },
    {
      type: 'copy',
      from: '/source/file.txt',
      to: '/dest/file.txt',
    },
    {
      type: 'remove',
      from: '/old/file.txt',
    },
  ]

  await applyFileOperationsModule.applyFileOperations(operations)

  expect(mockMakeDirectory).toHaveBeenCalledWith('/path/to/directory')
  expect(mockCopy).toHaveBeenCalledWith('/source/file.txt', '/dest/file.txt')
  expect(mockRemove).toHaveBeenCalledWith('/old/file.txt')

  expect(mockMakeDirectory).toHaveBeenCalledTimes(1)
  expect(mockCopy).toHaveBeenCalledTimes(1)
  expect(mockRemove).toHaveBeenCalledTimes(1)
})

test('applyFileOperations - handles copy operation error', async () => {
  const error = new Error('Copy failed')
  mockCopy.mockImplementation(() => {
    throw error
  })

  const operations = [
    {
      type: 'copy',
      from: '/source/file.txt',
      to: '/dest/file.txt',
    },
  ]

  await expect(applyFileOperationsModule.applyFileOperations(operations)).rejects.toThrow('Failed to apply file operation copy')
})

test('applyFileOperations - handles mkdir operation error', async () => {
  const error = new Error('Directory creation failed')
  mockMakeDirectory.mockImplementation(() => {
    throw error
  })

  const operations = [
    {
      type: 'mkdir',
      path: '/path/to/directory',
    },
  ]

  await expect(applyFileOperationsModule.applyFileOperations(operations)).rejects.toThrow('Failed to apply file operation mkdir')
})

test('applyFileOperations - handles remove operation error', async () => {
  const error = new Error('Remove failed')
  mockRemove.mockImplementation(() => {
    throw error
  })

  const operations = [
    {
      type: 'remove',
      from: '/path/to/file.txt',
    },
  ]

  await expect(applyFileOperationsModule.applyFileOperations(operations)).rejects.toThrow('Failed to apply file operation remove')
})

test('applyFileOperations - stops on first error and does not continue with remaining operations', async () => {
  const error = new Error('Copy failed')
  mockCopy.mockImplementation(() => {
    throw error
  })
  mockMakeDirectory.mockReturnValue(undefined)

  const operations = [
    {
      type: 'copy',
      from: '/source/file.txt',
      to: '/dest/file.txt',
    },
    {
      type: 'mkdir',
      path: '/path/to/directory',
    },
  ]

  await expect(applyFileOperationsModule.applyFileOperations(operations)).rejects.toThrow('Failed to apply file operation copy')

  // Should have called copy but not mkdir
  expect(mockCopy).toHaveBeenCalledTimes(1)
  expect(mockMakeDirectory).not.toHaveBeenCalled()
})

test('applyFileOperations - handles multiple copy operations', async () => {
  mockCopy.mockReturnValue(undefined)

  const operations = [
    {
      type: 'copy',
      from: '/source1/file1.txt',
      to: '/dest1/file1.txt',
    },
    {
      type: 'copy',
      from: '/source2/file2.txt',
      to: '/dest2/file2.txt',
    },
  ]

  await applyFileOperationsModule.applyFileOperations(operations)

  expect(mockCopy).toHaveBeenCalledWith('/source1/file1.txt', '/dest1/file1.txt')
  expect(mockCopy).toHaveBeenCalledWith('/source2/file2.txt', '/dest2/file2.txt')
  expect(mockCopy).toHaveBeenCalledTimes(2)
})

test('applyFileOperations - handles multiple mkdir operations', async () => {
  mockMakeDirectory.mockReturnValue(undefined)

  const operations = [
    {
      type: 'mkdir',
      path: '/path1/directory1',
    },
    {
      type: 'mkdir',
      path: '/path2/directory2',
    },
  ]

  await applyFileOperationsModule.applyFileOperations(operations)

  expect(mockMakeDirectory).toHaveBeenCalledWith('/path1/directory1')
  expect(mockMakeDirectory).toHaveBeenCalledWith('/path2/directory2')
  expect(mockMakeDirectory).toHaveBeenCalledTimes(2)
})

test('applyFileOperations - handles multiple remove operations', async () => {
  mockRemove.mockReturnValue(undefined)

  const operations = [
    {
      type: 'remove',
      from: '/path1/file1.txt',
    },
    {
      type: 'remove',
      from: '/path2/file2.txt',
    },
  ]

  await applyFileOperationsModule.applyFileOperations(operations)

  expect(mockRemove).toHaveBeenCalledWith('/path1/file1.txt', { recursive: true })
  expect(mockRemove).toHaveBeenCalledWith('/path2/file2.txt', { recursive: true })
  expect(mockRemove).toHaveBeenCalledTimes(2)
})

test('applyFileOperations - handles mixed operations with errors', async () => {
  mockCopy.mockReturnValue(undefined)
  mockMakeDirectory.mockReturnValue(undefined)
  const error = new Error('Remove failed')
  mockRemove.mockImplementation(() => {
    throw error
  })

  const operations = [
    {
      type: 'copy',
      from: '/source/file.txt',
      to: '/dest/file.txt',
    },
    {
      type: 'mkdir',
      path: '/path/to/directory',
    },
    {
      type: 'remove',
      from: '/path/to/file.txt',
    },
  ]

  await expect(applyFileOperationsModule.applyFileOperations(operations)).rejects.toThrow('Failed to apply file operation remove')

  // Should have called copy and mkdir but failed on remove
  expect(mockCopy).toHaveBeenCalledTimes(1)
  expect(mockMakeDirectory).toHaveBeenCalledTimes(1)
  expect(mockRemove).toHaveBeenCalledTimes(1)
})
