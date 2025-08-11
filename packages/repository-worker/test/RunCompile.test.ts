import { expect, jest, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.ts'
import { runCompile } from '../src/parts/RunCompile/RunCompile.ts'

test('runCompile throws error when main.js not found after compilation', async () => {
  const cwd = '/test/repo'
  const useNice = false
  const mainJsPath = '/test/repo/out/main.ts'

  const mockInvoke = jest.fn()
  mockInvoke.mockReturnValue({ stdout: '', stderr: '', exitCode: 0 })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await expect(runCompile(cwd, useNice, mainJsPath)).rejects.toThrow('Build failed: out/main.js not found after compilation')
  expect(mockInvoke).toHaveBeenCalled()
})
