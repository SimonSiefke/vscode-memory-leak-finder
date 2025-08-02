import { test, expect, jest, beforeEach } from '@jest/globals'
import { VError } from '@lvce-editor/verror'

const mockExeca = jest.fn()
jest.unstable_mockModule('execa', () => ({
  execa: mockExeca,
}))

beforeEach(() => {
  mockExeca.mockClear()
})

test('installDependencies - runs npm ci without nice', async () => {
  mockExeca.mockImplementation(() => Promise.resolve({ stdout: '', stderr: '' }))

  const { installDependencies } = await import('../src/parts/InstallDependencies/InstallDependencies.js')

  await installDependencies('/test/path', false)

  expect(mockExeca).toHaveBeenCalledWith('npm', ['ci'], { cwd: '/test/path' })
  expect(mockExeca).toHaveBeenCalledTimes(1)
})

test('installDependencies - runs npm ci with nice', async () => {
  mockExeca.mockImplementation(() => Promise.resolve({ stdout: '', stderr: '' }))

  const { installDependencies } = await import('../src/parts/InstallDependencies/InstallDependencies.js')

  await installDependencies('/test/path', true)

  expect(mockExeca).toHaveBeenCalledWith('nice', ['-n', '10', 'npm', 'ci'], { cwd: '/test/path' })
  expect(mockExeca).toHaveBeenCalledTimes(1)
})

test('installDependencies - throws VError when execa fails without nice', async () => {
  const error = new Error('npm ci failed')
  mockExeca.mockImplementation(() => Promise.reject(error))

  const { installDependencies } = await import('../src/parts/InstallDependencies/InstallDependencies.js')

  await expect(installDependencies('/test/path', false)).rejects.toThrow(VError)
  await expect(installDependencies('/test/path', false)).rejects.toThrow("Failed to install dependencies in directory '/test/path'")
})

test('installDependencies - throws VError when execa fails with nice', async () => {
  const error = new Error('nice command failed')
  mockExeca.mockImplementation(() => Promise.reject(error))

  const { installDependencies } = await import('../src/parts/InstallDependencies/InstallDependencies.js')

  await expect(installDependencies('/test/path', true)).rejects.toThrow(VError)
  await expect(installDependencies('/test/path', true)).rejects.toThrow("Failed to install dependencies in directory '/test/path'")
})
