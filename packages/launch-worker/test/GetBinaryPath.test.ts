import { beforeEach, expect, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

test('getBinaryPath - uses CLI flag when provided', async () => {
  const { getBinaryPath } = await import('../src/parts/GetBinaryPath/GetBinaryPath.ts')
  const result = await getBinaryPath('linux', 'x64', '1.100.0', '/custom/path', '', '', 'https://update.code.visualstudio.com')
  expect(result).toBe('/custom/path')
  expect(consoleSpy).not.toHaveBeenCalled()
})

test('getBinaryPath - uses environment variable with deprecation warning', async () => {
  const originalEnv = process.env.VSCODE_PATH
  process.env.VSCODE_PATH = '/env/path'

  const { getBinaryPath } = await import('../src/parts/GetBinaryPath/GetBinaryPath.ts')
  const result = await getBinaryPath('linux', 'x64', '1.100.0', '', '', '', 'https://update.code.visualstudio.com')

  expect(result).toBe('/env/path')
  expect(consoleSpy).toHaveBeenCalledWith(
    'Warning: Using VSCODE_PATH environment variable is deprecated. Please use --vscode-path CLI flag instead.',
  )

  process.env.VSCODE_PATH = originalEnv
})

test('getBinaryPath - prioritizes vscodePath over commit', async () => {
  const { getBinaryPath } = await import('../src/parts/GetBinaryPath/GetBinaryPath.ts')
  const result = await getBinaryPath('linux', 'x64', '1.100.0', '/custom/path', 'abc123', '', 'https://update.code.visualstudio.com')
  expect(result).toBe('/custom/path')
  expect(consoleSpy).not.toHaveBeenCalled()
})

test('getBinaryPath - disables vscode node modules cache via environment variable', async () => {
  const previousValue = process.env.VSCODE_MEMORY_LEAK_FINDER_DISABLE_VSCODE_NODE_MODULES_CACHE
  process.env.VSCODE_MEMORY_LEAK_FINDER_DISABLE_VSCODE_NODE_MODULES_CACHE = '1'

  const downloadAndBuildVscodeFromCommit = jest.fn(async () => '/resolved/path')

  jest.unstable_mockModule('../src/parts/DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.ts', () => ({
    downloadAndBuildVscodeFromCommit,
  }))

  try {
    const { getBinaryPath } = await import('../src/parts/GetBinaryPath/GetBinaryPath.ts')
    const result = await getBinaryPath('linux', 'x64', '1.100.0', '', 'abc123', '', 'https://update.code.visualstudio.com')

    expect(result).toBe('/resolved/path')
    expect(downloadAndBuildVscodeFromCommit.mock.calls).toEqual([
      ['linux', 'x64', 'abc123', 'https://github.com/microsoft/vscode.git', expect.stringContaining('/.vscode-repos'), '', true, ''],
    ])
  } finally {
    if (typeof previousValue === 'string') {
      process.env.VSCODE_MEMORY_LEAK_FINDER_DISABLE_VSCODE_NODE_MODULES_CACHE = previousValue
    } else {
      delete process.env.VSCODE_MEMORY_LEAK_FINDER_DISABLE_VSCODE_NODE_MODULES_CACHE
    }
  }
})

test('getBinaryPath - uses stable vscode repo path via environment variable', async () => {
  const previousValue = process.env.VSCODE_MEMORY_LEAK_FINDER_USE_STABLE_VSCODE_REPO_PATH
  process.env.VSCODE_MEMORY_LEAK_FINDER_USE_STABLE_VSCODE_REPO_PATH = '1'

  const downloadAndBuildVscodeFromCommit = jest.fn(async () => '/resolved/path')

  jest.unstable_mockModule('../src/parts/DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.ts', () => ({
    downloadAndBuildVscodeFromCommit,
  }))

  try {
    const { getBinaryPath } = await import('../src/parts/GetBinaryPath/GetBinaryPath.ts')
    const result = await getBinaryPath('linux', 'x64', '1.100.0', '', 'abc123', '', 'https://update.code.visualstudio.com')

    expect(result).toBe('/resolved/path')
    expect(downloadAndBuildVscodeFromCommit.mock.calls).toEqual([
      [
        'linux',
        'x64',
        'abc123',
        'https://github.com/microsoft/vscode.git',
        expect.stringContaining('/.vscode-repos'),
        expect.stringContaining('/.vscode-node-modules-cache'),
        true,
        'default',
      ],
    ])
  } finally {
    if (typeof previousValue === 'string') {
      process.env.VSCODE_MEMORY_LEAK_FINDER_USE_STABLE_VSCODE_REPO_PATH = previousValue
    } else {
      delete process.env.VSCODE_MEMORY_LEAK_FINDER_USE_STABLE_VSCODE_REPO_PATH
    }
  }
})
