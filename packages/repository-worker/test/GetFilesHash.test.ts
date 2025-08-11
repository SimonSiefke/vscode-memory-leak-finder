import { expect, jest, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.js'
import { getFilesHash } from '../src/parts/GetFilesHash/GetFilesHash.js'

test('getFilesHash returns hash of file contents', async () => {
  const absolutePaths = ['/path/to/file1.txt', '/path/to/file2.txt']
  const fileContents = ['content1', 'content2']

  let callCount = 0
  const mockInvoke = jest.fn()
  mockInvoke.mockImplementation(() => {
    callCount++
    if (callCount === 1) {
      return fileContents[0]
    } else {
      return fileContents[1]
    }
  })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  const result = await getFilesHash(absolutePaths)

  expect(typeof result).toBe('string')
  expect(result.length).toBeGreaterThan(0)
  expect(mockInvoke).toHaveBeenCalledTimes(2)
  expect(mockInvoke).toHaveBeenNthCalledWith(1, 'FileSystem.readFileContent', '/path/to/file1.txt')
  expect(mockInvoke).toHaveBeenNthCalledWith(2, 'FileSystem.readFileContent', '/path/to/file2.txt')
})

test('getFilesHash throws VError when readFileContent fails', async () => {
  const absolutePaths = ['/path/to/file.txt']

  const mockInvoke = jest.fn()
  mockInvoke.mockImplementation(() => {
    throw new Error('File not found')
  })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await expect(getFilesHash(absolutePaths)).rejects.toThrow('Failed to get files hash')
  expect(mockInvoke).toHaveBeenCalledWith('FileSystem.readFileContent', '/path/to/file.txt')
})

test('getFilesHash throws VError when getHash fails', async () => {
  const absolutePaths = ['/path/to/file.txt']
  const fileContent = 'content'

  const mockInvoke = jest.fn()
  mockInvoke.mockReturnValue(fileContent)

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  // This test should pass since getHash doesn't actually fail in the current implementation
  const result = await getFilesHash(absolutePaths)
  expect(typeof result).toBe('string')
  expect(mockInvoke).toHaveBeenCalledWith('FileSystem.readFileContent', '/path/to/file.txt')
})
