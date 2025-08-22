import { test, expect, jest, beforeEach } from '@jest/globals'
import { Buffer } from 'node:buffer'

const mockCp = jest.fn()
const mockMkdir = jest.fn()
const mockRm = jest.fn()
const mockReadFile = jest.fn()
const mockGlob = jest.fn()

const mockPathExists = jest.fn()

jest.unstable_mockModule('node:fs/promises', () => ({
  cp: mockCp,
  mkdir: mockMkdir,
  rm: mockRm,
  readFile: mockReadFile,
  glob: mockGlob,
}))

jest.unstable_mockModule('path-exists', () => ({
  pathExists: mockPathExists,
}))

let filesystemModule

beforeEach(async () => {
  // Reset all mocks
  jest.clearAllMocks()

  // Import the module after mocking
  filesystemModule = await import('../src/parts/Filesystem/Filesystem.ts')
})

test('copy - copies file with default options', async () => {
  mockCp.mockReturnValue(undefined)

  await filesystemModule.copy('/source/file.txt', '/dest/file.txt')

  expect(mockCp).toHaveBeenCalledWith('/source/file.txt', '/dest/file.txt', {
    recursive: true,
    force: true,
  })
})

test('copy - copies file with custom options', async () => {
  mockCp.mockReturnValue(undefined)

  await filesystemModule.copy('/source/file.txt', '/dest/file.txt', { recursive: false, force: false })

  expect(mockCp).toHaveBeenCalledWith('/source/file.txt', '/dest/file.txt', {
    recursive: false,
    force: false,
  })
})

test('copy - handles cp error', async () => {
  const error = new Error('Copy failed')
  mockCp.mockImplementation(() => {
    throw error
  })

  await expect(filesystemModule.copy('/source/file.txt', '/dest/file.txt')).rejects.toThrow('Copy failed')
})

test('makeDirectory - creates directory with default options', async () => {
  mockMkdir.mockReturnValue(undefined)

  await filesystemModule.makeDirectory('/path/to/dir')

  expect(mockMkdir).toHaveBeenCalledWith('/path/to/dir', { recursive: true })
})

test('makeDirectory - creates directory with custom options', async () => {
  mockMkdir.mockReturnValue(undefined)

  await filesystemModule.makeDirectory('/path/to/dir', { recursive: false })

  expect(mockMkdir).toHaveBeenCalledWith('/path/to/dir', { recursive: false })
})

test('makeDirectory - handles mkdir error', async () => {
  const error = new Error('Directory creation failed')
  mockMkdir.mockImplementation(() => {
    throw error
  })

  await expect(filesystemModule.makeDirectory('/path/to/dir')).rejects.toThrow('Directory creation failed')
})

test('remove - removes file with default options', async () => {
  mockRm.mockReturnValue(undefined)

  await filesystemModule.remove('/path/to/file.txt')

  expect(mockRm).toHaveBeenCalledWith('/path/to/file.txt', {
    recursive: true,
    force: true,
  })
})

test('remove - removes file with custom options', async () => {
  mockRm.mockReturnValue(undefined)

  await filesystemModule.remove('/path/to/file.txt', { recursive: false, force: false })

  expect(mockRm).toHaveBeenCalledWith('/path/to/file.txt', {
    recursive: false,
    force: false,
  })
})

test('remove - handles rm error', async () => {
  const error = new Error('Remove failed')
  mockRm.mockImplementation(() => {
    throw error
  })

  await expect(filesystemModule.remove('/path/to/file.txt')).rejects.toThrow('Remove failed')
})

test('readFileContent - reads file with default encoding', async () => {
  const fileContent = 'Hello, World!'
  mockReadFile.mockReturnValue(fileContent)

  const result = await filesystemModule.readFileContent('/path/to/file.txt')

  expect(mockReadFile).toHaveBeenCalledWith('/path/to/file.txt', { encoding: 'utf8' })
  expect(result).toBe(fileContent)
})

test('readFileContent - reads file with custom encoding', async () => {
  const fileContent = Buffer.from('Hello, World!')
  mockReadFile.mockReturnValue(fileContent)

  const result = await filesystemModule.readFileContent('/path/to/file.txt', 'base64')

  expect(mockReadFile).toHaveBeenCalledWith('/path/to/file.txt', { encoding: 'base64' })
  expect(result).toBe(fileContent)
})

test('readFileContent - handles readFile error', async () => {
  const error = new Error('File read failed')
  mockReadFile.mockImplementation(() => {
    throw error
  })

  await expect(filesystemModule.readFileContent('/path/to/file.txt')).rejects.toThrow('File read failed')
})

test('findFiles - finds files with glob pattern', async () => {
  const mockFiles = ['/path/file1.txt', '/path/file2.txt']
  const mockGlobIterator = {
    [Symbol.asyncIterator]: async function* () {
      for (const file of mockFiles) {
        yield file
      }
    },
  }
  mockGlob.mockReturnValue(mockGlobIterator)

  const result = await filesystemModule.findFiles('**/*.txt')

  expect(mockGlob).toHaveBeenCalledWith('**/*.txt', {})
  expect(result).toEqual(mockFiles)
})

test('findFiles - finds files with options', async () => {
  const mockFiles = ['/path/file1.txt']
  const mockGlobIterator = {
    [Symbol.asyncIterator]: async function* () {
      for (const file of mockFiles) {
        yield file
      }
    },
  }
  mockGlob.mockReturnValue(mockGlobIterator)

  const options = { cwd: '/working/dir', exclude: ['node_modules'] }
  const result = await filesystemModule.findFiles('**/*.txt', options)

  expect(mockGlob).toHaveBeenCalledWith('**/*.txt', options)
  expect(result).toEqual(mockFiles)
})

test('findFiles - returns empty array when no files found', async () => {
  const mockGlobIterator = {
    [Symbol.asyncIterator]: async function* () {
      // No files to yield
    },
  }
  mockGlob.mockReturnValue(mockGlobIterator)

  const result = await filesystemModule.findFiles('**/*.nonexistent')

  expect(mockGlob).toHaveBeenCalledWith('**/*.nonexistent', {})
  expect(result).toEqual([])
})

test('findFiles - handles glob error', async () => {
  const error = new Error('Glob pattern error')
  mockGlob.mockImplementation(() => {
    throw error
  })

  await expect(filesystemModule.findFiles('invalid[pattern')).rejects.toThrow('Glob pattern error')
})

test('pathExists - checks if path exists', async () => {
  mockPathExists.mockReturnValue(true)

  const result = await filesystemModule.pathExists('/path/to/file.txt')

  expect(mockPathExists).toHaveBeenCalledWith('/path/to/file.txt')
  expect(result).toBe(true)
})

test('pathExists - returns false for non-existent path', async () => {
  mockPathExists.mockReturnValue(false)

  const result = await filesystemModule.pathExists('/path/to/nonexistent.txt')

  expect(mockPathExists).toHaveBeenCalledWith('/path/to/nonexistent.txt')
  expect(result).toBe(false)
})

test('pathExists - handles pathExists error', async () => {
  mockPathExists.mockImplementation(() => {
    return Promise.reject(new Error('Path check failed'))
  })

  await expect(filesystemModule.pathExists('/path/to/file.txt')).rejects.toThrow('Path check failed')
})
