import { beforeEach, expect, jest, test } from '@jest/globals'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

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
const mockBuildLocalVscodeMinified = jest.fn<(platform: string, arch: string, repoPath: string, useNice: boolean) => Promise<string>>()

jest.unstable_mockModule('../src/parts/DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.ts', () => ({
  downloadAndBuildVscodeFromCommit: mockDownloadAndBuildVscodeFromCommit,
}))

jest.unstable_mockModule('../src/parts/BuildLocalVscodeMinified/BuildLocalVscodeMinified.ts', () => ({
  buildLocalVscodeMinified: mockBuildLocalVscodeMinified,
}))

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
  mockDownloadAndBuildVscodeFromCommit.mockResolvedValue('/built/vscode')
  mockBuildLocalVscodeMinified.mockImplementation(async (platform, arch, repoPath) => join(dirname(repoPath), `VSCode-${platform}-${arch}`, 'code-oss'))
})

const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

test('getBinaryPath - uses CLI flag when provided', async () => {
  const { getBinaryPath } = await import('../src/parts/GetBinaryPath/GetBinaryPath.ts')
  const result = await getBinaryPath('linux', 'x64', '1.100.0', '/custom/path', '', '', 'https://update.code.visualstudio.com', true)
  expect(result).toBe('/custom/path')
  expect(consoleSpy).not.toHaveBeenCalled()
  expect(mockDownloadAndBuildVscodeFromCommit).not.toHaveBeenCalled()
  expect(mockBuildLocalVscodeMinified).not.toHaveBeenCalled()
})

test('getBinaryPath - resolves local vscode checkout directory to code.sh', async () => {
  const root = await mkdtemp(join(tmpdir(), 'launch-worker-vscode-'))
  try {
    const repoPath = join(root, 'vscode')
    const codeScriptPath = join(repoPath, 'scripts', 'code.sh')
    await mkdir(join(repoPath, 'scripts'), { recursive: true })
    await writeFile(codeScriptPath, '')

    const { getBinaryPath } = await import('../src/parts/GetBinaryPath/GetBinaryPath.ts')
    const result = await getBinaryPath('linux', 'x64', '1.100.0', repoPath, '', '', 'https://update.code.visualstudio.com', false)

    expect(result).toBe(codeScriptPath)
    expect(mockBuildLocalVscodeMinified).not.toHaveBeenCalled()
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('getBinaryPath - resolves local vscode code.sh to code.sh', async () => {
  const root = await mkdtemp(join(tmpdir(), 'launch-worker-vscode-'))
  try {
    const repoPath = join(root, 'vscode')
    const codeScriptPath = join(repoPath, 'scripts', 'code.sh')
    await mkdir(join(repoPath, 'scripts'), { recursive: true })
    await writeFile(codeScriptPath, '')

    const { getBinaryPath } = await import('../src/parts/GetBinaryPath/GetBinaryPath.ts')
    const result = await getBinaryPath('linux', 'x64', '1.100.0', codeScriptPath, '', '', 'https://update.code.visualstudio.com', false)

    expect(result).toBe(codeScriptPath)
    expect(mockBuildLocalVscodeMinified).not.toHaveBeenCalled()
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('getBinaryPath - builds local minified vscode from checkout directory', async () => {
  const root = await mkdtemp(join(tmpdir(), 'launch-worker-vscode-'))
  try {
    const repoPath = join(root, 'vscode')
    const codeScriptPath = join(repoPath, 'scripts', 'code.sh')
    await mkdir(join(repoPath, 'scripts'), { recursive: true })
    await writeFile(codeScriptPath, '')

    const { getBinaryPath } = await import('../src/parts/GetBinaryPath/GetBinaryPath.ts')
    const result = await getBinaryPath('linux', 'x64', '1.100.0', repoPath, '', '', 'https://update.code.visualstudio.com', true)

    expect(result).toBe(join(root, 'VSCode-linux-x64', 'code-oss'))
    expect(mockBuildLocalVscodeMinified).toHaveBeenCalledWith('linux', 'x64', repoPath, true)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('getBinaryPath - forwards local minified build platform errors', async () => {
  const root = await mkdtemp(join(tmpdir(), 'launch-worker-vscode-'))
  try {
    const repoPath = join(root, 'vscode')
    const codeScriptPath = join(repoPath, 'scripts', 'code.sh')
    await mkdir(join(repoPath, 'scripts'), { recursive: true })
    await writeFile(codeScriptPath, '')
    mockBuildLocalVscodeMinified.mockRejectedValue(new Error('--build-vscode-minified is not supported on darwin'))

    const { getBinaryPath } = await import('../src/parts/GetBinaryPath/GetBinaryPath.ts')
    await expect(getBinaryPath('darwin', 'x64', '1.100.0', repoPath, '', '', 'https://update.code.visualstudio.com', true)).rejects.toThrow(
      '--build-vscode-minified is not supported on darwin',
    )
  } finally {
    await rm(root, { recursive: true, force: true })
  }
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
