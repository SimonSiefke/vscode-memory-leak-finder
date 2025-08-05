import { expect, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.js'
import { getFilesHash } from '../src/parts/GetFilesHash/GetFilesHash.js'

test('getFilesHash returns hash of file contents', async () => {
  const absolutePaths = ['/path/to/file1.txt', '/path/to/file2.txt']
  const fileContents = ['content1', 'content2']
  const expectedHash = 'test-hash'

  let callCount = 0
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method, path) => {
      if (method === 'FileSystem.readFileContent') {
        callCount++
        if (callCount === 1) {
          return fileContents[0]
        } else {
          return fileContents[1]
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  const result = await getFilesHash(absolutePaths)

  expect(result).toBe(expectedHash)
})

test('getFilesHash throws VError when readFileContent fails', async () => {
  const absolutePaths = ['/path/to/file.txt']

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method) => {
      if (method === 'FileSystem.readFileContent') {
        throw new Error('File not found')
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  await expect(getFilesHash(absolutePaths)).rejects.toThrow('Failed to get files hash')
})

test('getFilesHash throws VError when getHash fails', async () => {
  const absolutePaths = ['/path/to/file.txt']
  const fileContent = 'content'

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method) => {
      if (method === 'FileSystem.readFileContent') {
        return fileContent
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  await expect(getFilesHash(absolutePaths)).rejects.toThrow('Failed to get files hash')
})
