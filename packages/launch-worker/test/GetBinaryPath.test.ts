import { beforeEach, expect, jest, test } from '@jest/globals'

const mockDownloadAndBuildVscodeFromCommit =
  jest.fn<
    (
      platform: string,
      arch: string,
      commitHash: string,
      repoUrl: string,
      reposDir: string,
      nodeModulesCacheDir: string,
      useNice: boolean,
      buildVscodeMinified: boolean,
    ) => Promise<string>
  >()

jest.unstable_mockModule('../src/parts/DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.ts', () => ({
  downloadAndBuildVscodeFromCommit: mockDownloadAndBuildVscodeFromCommit,
}))

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
  mockDownloadAndBuildVscodeFromCommit.mockResolvedValue('/built/vscode')
})

const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

test('getBinaryPath - uses CLI flag when provided', async () => {
  const { getBinaryPath } = await import('../src/parts/GetBinaryPath/GetBinaryPath.ts')
  const result = await getBinaryPath('linux', 'x64', '1.100.0', '/custom/path', '', '', 'https://update.code.visualstudio.com', true)
  expect(result).toBe('/custom/path')
  expect(consoleSpy).not.toHaveBeenCalled()
  expect(mockDownloadAndBuildVscodeFromCommit).not.toHaveBeenCalled()
})

test('getBinaryPath - uses environment variable with deprecation warning', async () => {
  const originalEnv = process.env.VSCODE_PATH
  process.env.VSCODE_PATH = '/env/path'

  const { getBinaryPath } = await import('../src/parts/GetBinaryPath/GetBinaryPath.ts')
  const result = await getBinaryPath('linux', 'x64', '1.100.0', '', '', '', 'https://update.code.visualstudio.com', true)

  expect(result).toBe('/env/path')
  expect(consoleSpy).toHaveBeenCalledWith(
    'Warning: Using VSCODE_PATH environment variable is deprecated. Please use --vscode-path CLI flag instead.',
  )

  process.env.VSCODE_PATH = originalEnv
})

test('getBinaryPath - prioritizes vscodePath over commit', async () => {
  const { getBinaryPath } = await import('../src/parts/GetBinaryPath/GetBinaryPath.ts')
  const result = await getBinaryPath('linux', 'x64', '1.100.0', '/custom/path', 'abc123', '', 'https://update.code.visualstudio.com', true)
  expect(result).toBe('/custom/path')
  expect(consoleSpy).not.toHaveBeenCalled()
  expect(mockDownloadAndBuildVscodeFromCommit).not.toHaveBeenCalled()
})

test('getBinaryPath - forwards buildVscodeMinified for commit builds', async () => {
  const { getBinaryPath } = await import('../src/parts/GetBinaryPath/GetBinaryPath.ts')
  const result = await getBinaryPath('linux', 'x64', '1.100.0', '', 'abc123', '', 'https://update.code.visualstudio.com', true)
  expect(result).toBe('/built/vscode')
  expect(mockDownloadAndBuildVscodeFromCommit).toHaveBeenCalledWith(
    'linux',
    'x64',
    'abc123',
    'https://github.com/microsoft/vscode.git',
    expect.stringContaining('.vscode-repos'),
    expect.stringContaining('.vscode-node-modules-cache'),
    true,
    true,
  )
})
