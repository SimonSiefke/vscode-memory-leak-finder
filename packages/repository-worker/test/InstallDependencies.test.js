import { test, expect } from '@jest/globals'
import { VError } from '@lvce-editor/verror'
import { MockRpc } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.js'

test('installDependencies - runs npm ci without nice', async () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'FileSystem.exec') {
        return { stdout: '', stderr: '' }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  const { installDependencies } = await import('../src/parts/InstallDependencies/InstallDependencies.js')
  await installDependencies('/test/path', false)
})

test('installDependencies - runs npm ci with nice', async () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'FileSystem.exec') {
        return { stdout: '', stderr: '' }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  const { installDependencies } = await import('../src/parts/InstallDependencies/InstallDependencies.js')
  await installDependencies('/test/path', true)
})

test('installDependencies - throws VError when exec fails without nice', async () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'FileSystem.exec') {
        throw new Error('npm ci failed')
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  const { installDependencies } = await import('../src/parts/InstallDependencies/InstallDependencies.js')
  await expect(installDependencies('/test/path', false)).rejects.toThrow(VError)
  await expect(installDependencies('/test/path', false)).rejects.toThrow("Failed to install dependencies in directory '/test/path'")
})

test('installDependencies - throws VError when exec fails with nice', async () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'FileSystem.exec') {
        throw new Error('nice command failed')
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  const { installDependencies } = await import('../src/parts/InstallDependencies/InstallDependencies.js')
  await expect(installDependencies('/test/path', true)).rejects.toThrow(VError)
  await expect(installDependencies('/test/path', true)).rejects.toThrow("Failed to install dependencies in directory '/test/path'")
})
