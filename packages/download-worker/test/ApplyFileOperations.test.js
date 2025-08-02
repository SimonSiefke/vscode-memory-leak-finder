import { test, expect, jest } from '@jest/globals'
import * as ApplyFileOperations from '../src/parts/ApplyFileOperations/ApplyFileOperations.js'

test('applyFileOperations should return early when no operations provided', async () => {
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

  await ApplyFileOperations.applyFileOperations([])

  expect(consoleSpy).not.toHaveBeenCalled()

  consoleSpy.mockRestore()
})

test('applyFileOperations should apply copy operations', async () => {
  const mockCpSync = jest.fn()
  const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {})

  // Mock fs module
  jest.unstable_mockModule('node:fs', () => ({
    cpSync: mockCpSync,
    rmSync: jest.fn(),
  }))

  const { applyFileOperations } = await import('../src/parts/ApplyFileOperations/ApplyFileOperations.js')

  const operations = [
    {
      type: 'copy',
      from: '/source/path',
      to: '/target/path',
    },
  ]

  await applyFileOperations(operations)

  expect(mockCpSync).toHaveBeenCalledWith('/source/path', '/target/path', {
    recursive: true,
    force: true,
  })
  expect(mockConsoleLog).toHaveBeenCalledWith('Applying 1 file operation(s) in parallel')
  expect(mockConsoleLog).toHaveBeenCalledWith('Copied: /source/path -> /target/path')

  mockConsoleLog.mockRestore()
  jest.unstable_mockModule('node:fs', () => jest.requireActual('node:fs'))
})

test('applyFileOperations should apply remove operations', async () => {
  const mockRmSync = jest.fn()
  const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {})

  // Mock fs module
  jest.unstable_mockModule('node:fs', () => ({
    cpSync: jest.fn(),
    rmSync: mockRmSync,
  }))

  const { applyFileOperations } = await import('../src/parts/ApplyFileOperations/ApplyFileOperations.js')

  const operations = [
    {
      type: 'remove',
      from: '/path/to/remove',
      to: '',
    },
  ]

  await applyFileOperations(operations)

  expect(mockRmSync).toHaveBeenCalledWith('/path/to/remove', {
    recursive: true,
    force: true,
  })
  expect(mockConsoleLog).toHaveBeenCalledWith('Applying 1 file operation(s) in parallel')
  expect(mockConsoleLog).toHaveBeenCalledWith('Removed: /path/to/remove')

  mockConsoleLog.mockRestore()
  jest.unstable_mockModule('node:fs', () => jest.requireActual('node:fs'))
})

test('applyFileOperations should apply multiple operations in parallel', async () => {
  const mockCpSync = jest.fn()
  const mockRmSync = jest.fn()
  const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {})

  // Mock fs module
  jest.unstable_mockModule('node:fs', () => ({
    cpSync: mockCpSync,
    rmSync: mockRmSync,
  }))

  const { applyFileOperations } = await import('../src/parts/ApplyFileOperations/ApplyFileOperations.js')

  const operations = [
    {
      type: 'copy',
      from: '/source1',
      to: '/target1',
    },
    {
      type: 'remove',
      from: '/path/to/remove',
      to: '',
    },
    {
      type: 'copy',
      from: '/source2',
      to: '/target2',
    },
  ]

  await applyFileOperations(operations)

  expect(mockCpSync).toHaveBeenCalledTimes(2)
  expect(mockRmSync).toHaveBeenCalledTimes(1)
  expect(mockConsoleLog).toHaveBeenCalledWith('Applying 3 file operation(s) in parallel')

  mockConsoleLog.mockRestore()
  jest.unstable_mockModule('node:fs', () => jest.requireActual('node:fs'))
})

test('applyFileOperations should throw error when operation fails', async () => {
  const mockCpSync = jest.fn().mockImplementation(() => {
    throw new Error('Copy failed')
  })
  const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {})

  // Mock fs module
  jest.unstable_mockModule('node:fs', () => ({
    cpSync: mockCpSync,
    rmSync: jest.fn(),
  }))

  const { applyFileOperations } = await import('../src/parts/ApplyFileOperations/ApplyFileOperations.js')

  const operations = [
    {
      type: 'copy',
      from: '/source',
      to: '/target',
    },
  ]

  await expect(applyFileOperations(operations)).rejects.toThrow('Copy failed')
  expect(mockConsoleWarn).toHaveBeenCalledWith('Failed to apply file operation copy: Copy failed')

  mockConsoleWarn.mockRestore()
  jest.unstable_mockModule('node:fs', () => jest.requireActual('node:fs'))
})