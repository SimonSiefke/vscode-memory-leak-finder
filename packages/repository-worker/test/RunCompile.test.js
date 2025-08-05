import { expect, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.js'
import { runCompile } from '../src/parts/RunCompile/RunCompile.js'

test('runCompile executes npm run compile without nice', async () => {
  const cwd = '/test/repo'
  const useNice = false
  const mainJsPath = '/test/repo/out/main.js'

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'FileSystem.exec') {
        return { stdout: '', stderr: '', exitCode: 0 }
      }
      if (method === 'FileSystem.pathExists') {
        return true
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  await runCompile(cwd, useNice, mainJsPath)
})

test('runCompile executes npm run compile with nice', async () => {
  const cwd = '/test/repo'
  const useNice = true
  const mainJsPath = '/test/repo/out/main.js'

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'FileSystem.exec') {
        return { stdout: '', stderr: '', exitCode: 0 }
      }
      if (method === 'FileSystem.pathExists') {
        return true
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  await runCompile(cwd, useNice, mainJsPath)
})

test('runCompile throws error when main.js not found after compilation', async () => {
  const cwd = '/test/repo'
  const useNice = false
  const mainJsPath = '/test/repo/out/main.js'

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'FileSystem.exec') {
        return { stdout: '', stderr: '', exitCode: 0 }
      }
      if (method === 'FileSystem.pathExists') {
        return false
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  await expect(runCompile(cwd, useNice, mainJsPath)).rejects.toThrow('Build failed: out/main.js not found after compilation')
})

test('runCompile logs when using nice', async () => {
  const cwd = '/test/repo'
  const useNice = true
  const mainJsPath = '/test/repo/out/main.js'

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'FileSystem.exec') {
        return { stdout: '', stderr: '', exitCode: 0 }
      }
      if (method === 'FileSystem.pathExists') {
        return true
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  await runCompile(cwd, useNice, mainJsPath)
})
