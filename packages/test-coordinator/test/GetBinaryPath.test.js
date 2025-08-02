import { beforeEach, expect, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

test('getBinaryPath - uses CLI flag when provided', async () => {
  const { getBinaryPath } = await import('../src/parts/GetBinaryPath/GetBinaryPath.js')
  const result = await getBinaryPath('1.100.0', '/custom/path', '')
  expect(result).toBe('/custom/path')
  expect(consoleSpy).not.toHaveBeenCalled()
})

test('getBinaryPath - uses environment variable with deprecation warning', async () => {
  const originalEnv = process.env.VSCODE_PATH
  process.env.VSCODE_PATH = '/env/path'

  const { getBinaryPath } = await import('../src/parts/GetBinaryPath/GetBinaryPath.js')
  const result = await getBinaryPath('1.100.0', '', '')

  expect(result).toBe('/env/path')
  expect(consoleSpy).toHaveBeenCalledWith(
    'Warning: Using VSCODE_PATH environment variable is deprecated. Please use --vscode-path CLI flag instead.',
  )

  process.env.VSCODE_PATH = originalEnv
})

test('getBinaryPath - prioritizes vscodePath over commit', async () => {
  const { getBinaryPath } = await import('../src/parts/GetBinaryPath/GetBinaryPath.js')
  const result = await getBinaryPath('1.100.0', '/custom/path', 'abc123')
  expect(result).toBe('/custom/path')
  expect(consoleSpy).not.toHaveBeenCalled()
})
