import { expect, test, jest } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.js'
import { cloneRepository } from '../src/parts/CloneRepository/CloneRepository.js'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.ts'
import { cloneRepository } from '../src/parts/CloneRepository/CloneRepository.ts'

test('cloneRepository executes git clone command', async () => {
  const repoUrl = 'https://github.com/microsoft/vscode.git'
  const repoPath = '/test/repo'

  const mockInvoke = jest.fn()
  mockInvoke.mockReturnValue({ stdout: '', stderr: '', exitCode: 0 })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await cloneRepository(repoUrl, repoPath)

  expect(mockInvoke).toHaveBeenCalled()
})

test('cloneRepository throws VError when git clone fails', async () => {
  const repoUrl = 'https://github.com/nonexistent/repo.git'
  const repoPath = '/test/repo'

  const mockInvoke = jest.fn()
  mockInvoke.mockImplementation(() => {
    throw new Error('Repository not found')
  })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await expect(cloneRepository(repoUrl, repoPath)).rejects.toThrow(`Failed to clone repository from '${repoUrl}' to '${repoPath}'`)
  expect(mockInvoke).toHaveBeenCalled()
})

test('cloneRepository handles different repository URLs', async () => {
  const repoUrl = 'git@github.com:microsoft/vscode.git'
  const repoPath = '/test/repo'

  const mockInvoke = jest.fn()
  mockInvoke.mockReturnValue({ stdout: '', stderr: '', exitCode: 0 })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await cloneRepository(repoUrl, repoPath)

  expect(mockInvoke).toHaveBeenCalled()
})

test('cloneRepository handles different local paths', async () => {
  const repoUrl = 'https://github.com/microsoft/vscode.git'
  const repoPath = '/custom/path/to/repo'

  const mockInvoke = jest.fn()
  mockInvoke.mockReturnValue({ stdout: '', stderr: '', exitCode: 0 })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await cloneRepository(repoUrl, repoPath)

  expect(mockInvoke).toHaveBeenCalled()
})
