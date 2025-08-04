import { expect, test, jest } from '@jest/globals'

const mockExec = jest.fn(async () => ({ stdout: '', stderr: '', exitCode: 0 }))

jest.unstable_mockModule('../src/parts/Exec/Exec.js', () => ({
  exec: mockExec,
}))

const { checkoutCommit } = await import('../src/parts/CheckoutCommit/CheckoutCommit.js')

test('checkoutCommit executes git checkout command', async () => {
  const repoPath = '/test/repo'
  const commit = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0'

  mockExec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

  await checkoutCommit(repoPath, commit)

  expect(mockExec).toHaveBeenCalledWith('git', ['checkout', commit], { cwd: repoPath })
})

test('checkoutCommit handles different commit formats', async () => {
  const repoPath = '/test/repo'
  const commit = 'main'

  mockExec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

  await checkoutCommit(repoPath, commit)

  expect(mockExec).toHaveBeenCalledWith('git', ['checkout', commit], { cwd: repoPath })
})

test('checkoutCommit handles short commit hash', async () => {
  const repoPath = '/test/repo'
  const commit = 'a1b2c3d'

  mockExec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

  await checkoutCommit(repoPath, commit)

  expect(mockExec).toHaveBeenCalledWith('git', ['checkout', commit], { cwd: repoPath })
})
