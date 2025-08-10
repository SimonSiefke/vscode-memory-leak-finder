import { test, expect, jest } from '@jest/globals'
import { VError } from '@lvce-editor/verror'
import { MockRpc } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.s'
import { installDependencies } from '../src/parts/InstallDependencies/InstallDependencies.ts'

test('installDependencies - runs npm ci without nice', async () => {
  const mockInvoke = jest.fn()
  mockInvoke.mockReturnValue({ stdout: '', stderr: '' })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await installDependencies('/test/path', false)

  expect(mockInvoke).toHaveBeenCalled()
})

test('installDependencies - runs npm ci with nice', async () => {
  const mockInvoke = jest.fn()
  mockInvoke.mockReturnValue({ stdout: '', stderr: '' })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await installDependencies('/test/path', true)

  expect(mockInvoke).toHaveBeenCalled()
})

test('installDependencies - throws VError when exec fails without nice', async () => {
  const mockInvoke = jest.fn()
  mockInvoke.mockImplementation(() => {
    throw new Error('npm ci failed')
  })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await expect(installDependencies('/test/path', false)).rejects.toThrow(VError)
  await expect(installDependencies('/test/path', false)).rejects.toThrow("Failed to install dependencies in directory '/test/path'")
  expect(mockInvoke).toHaveBeenCalled()
})

test('installDependencies - throws VError when exec fails with nice', async () => {
  const mockInvoke = jest.fn()
  mockInvoke.mockImplementation(() => {
    throw new Error('nice command failed')
  })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await expect(installDependencies('/test/path', true)).rejects.toThrow(VError)
  await expect(installDependencies('/test/path', true)).rejects.toThrow("Failed to install dependencies in directory '/test/path'")
  expect(mockInvoke).toHaveBeenCalled()
})
