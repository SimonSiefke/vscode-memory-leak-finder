import { expect, test, jest } from '@jest/globals'

const mockExec = jest.fn(async () => ({ stdout: '', stderr: '', exitCode: 0 }))

jest.unstable_mockModule('../src/parts/Exec/Exec.js', () => ({
  exec: mockExec,
}))

const { cloneRepository } = await import('../src/parts/CloneRepository/CloneRepository.js')

test('cloneRepository executes git clone command', async () => {
  const repoUrl = 'https://github.com/microsoft/vscode.git'
  const repoPath = '/test/repo'

  mockExec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

  await cloneRepository(repoUrl, repoPath)

  // @ts-ignore
  expect(mockExec).toHaveBeenCalledWith('git', ['clone', '--depth', '1', repoUrl, repoPath])
})

test('cloneRepository throws VError when git clone fails', async () => {
  const repoUrl = 'https://github.com/nonexistent/repo.git'
  const repoPath = '/test/repo'
  const error = new Error('Repository not found')

  mockExec.mockRejectedValue(error)

  await expect(cloneRepository(repoUrl, repoPath)).rejects.toThrow(`Failed to clone repository from '${repoUrl}' to '${repoPath}'`)
})

test('cloneRepository handles different repository URLs', async () => {
  const repoUrl = 'git@github.com:microsoft/vscode.git'
  const repoPath = '/test/repo'

  mockExec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

  await cloneRepository(repoUrl, repoPath)

  // @ts-ignore
  expect(mockExec).toHaveBeenCalledWith('git', ['clone', '--depth', '1', repoUrl, repoPath])
})

test('cloneRepository handles different local paths', async () => {
  const repoUrl = 'https://github.com/microsoft/vscode.git'
  const repoPath = '/custom/path/to/repo'

  mockExec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

  await cloneRepository(repoUrl, repoPath)

  // @ts-ignore
  expect(mockExec).toHaveBeenCalledWith('git', ['clone', '--depth', '1', repoUrl, repoPath])
})
