import { expect, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.ts'
import { runCompile } from '../src/parts/RunCompile/RunCompile.ts'

test('runCompile runs the transpile step after compile', async () => {
  const cwd = '/test/repo'
  const useNice = false
  const mainJsPath = '/test/repo/out/main.js'
  const execCalls: unknown[][] = []

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke(method: string, ...params: unknown[]) {
      if (method === 'FileSystem.readFileContent') {
        return '20'
      }
      if (method === 'FileSystem.exists') {
        return true
      }
      if (method === 'FileSystem.exec') {
        execCalls.push(params)
        return { exitCode: 0, stderr: '', stdout: '' }
      }
      throw new Error(`not implemented: ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  await runCompile(cwd, useNice, mainJsPath)

  expect(execCalls).toHaveLength(2)
  expect(execCalls[0]?.[1]).toEqual(['run', 'compile'])
  expect(execCalls[0]?.[2]).toEqual({ cwd, reject: false })
  expect(execCalls[1]?.[1]).toEqual(['gulp', 'transpile-client-esbuild'])
  expect(execCalls[1]?.[2]).toEqual({ cwd, reject: false })
})

test('runCompile throws error when main.js not found after compilation', async () => {
  const cwd = '/test/repo'
  const useNice = false
  const mainJsPath = '/test/repo/out/main.js'

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke(method: string, ...params: unknown[]) {
      if (method === 'FileSystem.readFileContent') {
        return '20'
      }
      if (method === 'FileSystem.exists') {
        const path = params[0]
        if (path === mainJsPath) {
          return false
        }
        return true
      }
      if (method === 'FileSystem.exec') {
        return { exitCode: 0, stderr: '', stdout: '' }
      }
      throw new Error(`not implemented: ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)
  await expect(runCompile(cwd, useNice, mainJsPath)).rejects.toThrow('Build failed: out/main.js not found after compilation')
})
