import { expect, jest, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import { checkoutCommit } from '../src/parts/CheckoutCommit/CheckoutCommit.ts'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.ts'

test('checkoutCommit executes git checkout command', async () => {
  const repoPath = '/test/repo'
  const commit = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0'

  const mockInvoke = jest.fn()
  mockInvoke.mockReturnValue({ stdout: '', stderr: '', exitCode: 0 })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await checkoutCommit(repoPath, commit)

  expect(mockInvoke).toHaveBeenCalled()
})

test('checkoutCommit handles different commit formats', async () => {
  const repoPath = '/test/repo'
  const commit = 'main'

  const mockInvoke = jest.fn()
  mockInvoke.mockReturnValue({ stdout: '', stderr: '', exitCode: 0 })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await checkoutCommit(repoPath, commit)

  expect(mockInvoke).toHaveBeenCalled()
})

test('checkoutCommit handles short commit hash', async () => {
  const repoPath = '/test/repo'
  const commit = 'a1b2c3d'

  const mockInvoke = jest.fn()
  mockInvoke.mockReturnValue({ stdout: '', stderr: '', exitCode: 0 })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await checkoutCommit(repoPath, commit)

  expect(mockInvoke).toHaveBeenCalled()
})
