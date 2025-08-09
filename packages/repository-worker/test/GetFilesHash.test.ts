import { expect, test, jest } from '@jest/globals'

const mockReadFileContent = jest.fn(async () => '')
const mockGetHash = jest.fn(() => '')

jest.unstable_mockModule('../src/parts/Filesystem/Filesystem.ts', () => ({
  readFileContent: mockReadFileContent,
}))

jest.unstable_mockModule('../src/parts/GetHash/GetHash.ts', () => ({
  getHash: mockGetHash,
}))

const { getFilesHash } = await import('../src/parts/GetFilesHash/GetFilesHash.ts')

test('getFilesHash returns hash of file contents', async () => {
  const absolutePaths = ['/path/to/file1.txt', '/path/to/file2.txt']
  const fileContents = ['content1', 'content2']
  const expectedHash = 'test-hash'

  mockReadFileContent.mockResolvedValueOnce(fileContents[0]).mockResolvedValueOnce(fileContents[1])
  mockGetHash.mockReturnValue(expectedHash)

  const result = await getFilesHash(absolutePaths)

  expect(result).toBe(expectedHash)
  // @ts-ignore
  expect(mockReadFileContent).toHaveBeenCalledWith('/path/to/file1.txt')
  // @ts-ignore
  expect(mockReadFileContent).toHaveBeenCalledWith('/path/to/file2.txt')
  // @ts-ignore
  expect(mockGetHash).toHaveBeenCalledWith(fileContents)
})

test('getFilesHash throws VError when readFileContent fails', async () => {
  const absolutePaths = ['/path/to/file.txt']
  const error = new Error('File not found')

  mockReadFileContent.mockRejectedValue(error)

  await expect(getFilesHash(absolutePaths)).rejects.toThrow('Failed to get files hash')
})

test('getFilesHash throws VError when getHash fails', async () => {
  const absolutePaths = ['/path/to/file.txt']
  const fileContent = 'content'
  const error = new Error('Hash computation failed')

  mockReadFileContent.mockResolvedValue(fileContent)
  mockGetHash.mockImplementation(() => {
    throw error
  })

  await expect(getFilesHash(absolutePaths)).rejects.toThrow('Failed to get files hash')
})
