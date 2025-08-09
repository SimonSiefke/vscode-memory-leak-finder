import { beforeEach, expect, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

test('getBinaryPath - uses CLI flag when provided', async () => {
  const { getBinaryPath } = await import('../src/parts/GetBinaryPath/GetBinaryPath.ts')
  const result = await getBinaryPath('1.100.0', '/custom/path', '')
  expect(result).toBe('/custom/path')
  expect(consoleSpy).not.toHaveBeenCalled()
})

test('getBinaryPath - uses environment variable with deprecation warning', async () => {
  const originalEnv = process.env.VSCODE_PATH
  process.env.VSCODE_PATH = '/env/path'

  const { getBinaryPath } = await import('../src/parts/GetBinaryPath/GetBinaryPath.ts')
  const result = await getBinaryPath('1.100.0', '', '')

  expect(result).toBe('/env/path')
  expect(consoleSpy).toHaveBeenCalledWith(
    'Warning: Using VSCODE_PATH environment variable is deprecated. Please use --vscode-path CLI flag instead.',
  )

  process.env.VSCODE_PATH = originalEnv
})

test('getBinaryPath - prioritizes vscodePath over commit', async () => {
  const { getBinaryPath } = await import('../src/parts/GetBinaryPath/GetBinaryPath.ts')
  const result = await getBinaryPath('1.100.0', '/custom/path', 'abc123')
  expect(result).toBe('/custom/path')
  expect(consoleSpy).not.toHaveBeenCalled()
})

test('getBinaryPath - uses commit when no vscodePath provided', async () => {
  // @ts-ignore
  const mockDownloadAndBuildVscodeFromCommit = jest.fn().mockResolvedValue('/path/to/built/vscode')

  jest.unstable_mockModule('../src/parts/DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.js', () => ({
    downloadAndBuildVscodeFromCommit: mockDownloadAndBuildVscodeFromCommit,
  }))

  const { getBinaryPath } = await import('../src/parts/GetBinaryPath/GetBinaryPath.js')
  const result = await getBinaryPath('1.100.0', '', 'abc123')

  expect(result).toBe('/path/to/built/vscode')
  expect(mockDownloadAndBuildVscodeFromCommit).toHaveBeenCalledWith('abc123')
  expect(consoleSpy).not.toHaveBeenCalled()
})
