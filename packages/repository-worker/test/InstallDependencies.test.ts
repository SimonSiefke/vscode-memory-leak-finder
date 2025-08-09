import { test, expect, jest, beforeEach } from '@jest/globals'
import { VError } from '@lvce-editor/verror'

const mockExec = jest.fn()
jest.unstable_mockModule('../src/parts/Exec/Exec.ts', () => ({
  exec: mockExec,
}))

const { installDependencies } = await import('../src/parts/InstallDependencies/InstallDependencies.ts')

beforeEach(() => {
  mockExec.mockClear()
})

test('installDependencies - runs npm ci without nice', async () => {
  mockExec.mockImplementation(() => ({ stdout: '', stderr: '' }))

  await installDependencies('/test/path', false)

  expect(mockExec).toHaveBeenCalledWith('npm', ['ci'], { cwd: '/test/path' })
  expect(mockExec).toHaveBeenCalledTimes(1)
})

test('installDependencies - runs npm ci with nice', async () => {
  mockExec.mockImplementation(() => ({ stdout: '', stderr: '' }))

  await installDependencies('/test/path', true)

  expect(mockExec).toHaveBeenCalledWith('nice', ['-n', '10', 'npm', 'ci'], { cwd: '/test/path' })
  expect(mockExec).toHaveBeenCalledTimes(1)
})

test('installDependencies - throws VError when exec fails without nice', async () => {
  const error = new Error('npm ci failed')
  mockExec.mockImplementation(() => Promise.reject(error))

  await expect(installDependencies('/test/path', false)).rejects.toThrow(VError)
  await expect(installDependencies('/test/path', false)).rejects.toThrow("Failed to install dependencies in directory '/test/path'")
})

test('installDependencies - throws VError when exec fails with nice', async () => {
  const error = new Error('nice command failed')
  mockExec.mockImplementation(() => Promise.reject(error))

  await expect(installDependencies('/test/path', true)).rejects.toThrow(VError)
  await expect(installDependencies('/test/path', true)).rejects.toThrow("Failed to install dependencies in directory '/test/path'")
})
