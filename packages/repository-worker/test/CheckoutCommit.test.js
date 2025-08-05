import { expect, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.js'
import { checkoutCommit } from '../src/parts/CheckoutCommit/CheckoutCommit.js'

test('checkoutCommit executes git checkout command', async () => {
  const repoPath = '/test/repo'
  const commit = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0'

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method) => {
      if (method === 'FileSystem.exec') {
        return { stdout: '', stderr: '', exitCode: 0 }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  await checkoutCommit(repoPath, commit)
})

test('checkoutCommit handles different commit formats', async () => {
  const repoPath = '/test/repo'
  const commit = 'main'

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method) => {
      if (method === 'FileSystem.exec') {
        return { stdout: '', stderr: '', exitCode: 0 }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  await checkoutCommit(repoPath, commit)
})

test('checkoutCommit handles short commit hash', async () => {
  const repoPath = '/test/repo'
  const commit = 'a1b2c3d'

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method) => {
      if (method === 'FileSystem.exec') {
        return { stdout: '', stderr: '', exitCode: 0 }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  await checkoutCommit(repoPath, commit)
})
