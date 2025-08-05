import { expect, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.js'

test('cloneRepository executes git clone command', async () => {
  const repoUrl = 'https://github.com/microsoft/vscode.git'
  const repoPath = '/test/repo'

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'FileSystem.exec') {
        return { stdout: '', stderr: '', exitCode: 0 }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  const { cloneRepository } = await import('../src/parts/CloneRepository/CloneRepository.js')
  await cloneRepository(repoUrl, repoPath)
})

test('cloneRepository throws VError when git clone fails', async () => {
  const repoUrl = 'https://github.com/nonexistent/repo.git'
  const repoPath = '/test/repo'

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'FileSystem.exec') {
        throw new Error('Repository not found')
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  const { cloneRepository } = await import('../src/parts/CloneRepository/CloneRepository.js')
  await expect(cloneRepository(repoUrl, repoPath)).rejects.toThrow(`Failed to clone repository from '${repoUrl}' to '${repoPath}'`)
})

test('cloneRepository handles different repository URLs', async () => {
  const repoUrl = 'git@github.com:microsoft/vscode.git'
  const repoPath = '/test/repo'

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'FileSystem.exec') {
        return { stdout: '', stderr: '', exitCode: 0 }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  const { cloneRepository } = await import('../src/parts/CloneRepository/CloneRepository.js')
  await cloneRepository(repoUrl, repoPath)
})

test('cloneRepository handles different local paths', async () => {
  const repoUrl = 'https://github.com/microsoft/vscode.git'
  const repoPath = '/custom/path/to/repo'

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'FileSystem.exec') {
        return { stdout: '', stderr: '', exitCode: 0 }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  const { cloneRepository } = await import('../src/parts/CloneRepository/CloneRepository.js')
  await cloneRepository(repoUrl, repoPath)
})
