import { beforeEach, expect, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

test('downloadAndBuildVscodeFromCommit - launches repository worker and calls correct command', async () => {
  const mockLaunch = jest.fn()
  const mockInvoke = jest.fn()
  const mockDispose = jest.fn()

  const mockIpc = {
    dispose: mockDispose,
  }

  // @ts-ignore
  mockLaunch.mockResolvedValue(mockIpc)
  // @ts-ignore
  mockInvoke.mockResolvedValue('/path/to/built/vscode')

  jest.unstable_mockModule('../src/parts/RepositoryWorker/RepositoryWorker.js', () => ({
    launch: mockLaunch,
  }))

  jest.unstable_mockModule('../src/parts/JsonRpc/JsonRpc.js', () => ({
    invoke: mockInvoke,
  }))

  const { downloadAndBuildVscodeFromCommit } = await import(
    '../src/parts/DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.js'
  )

  const result = await downloadAndBuildVscodeFromCommit('abc123')

  expect(mockLaunch).toHaveBeenCalled()
  expect(mockInvoke).toHaveBeenCalledWith(
    mockIpc,
    'Repository.downloadAndBuildVscodeFromCommit',
    'abc123',
    'https://github.com/microsoft/vscode.git',
    expect.stringContaining('.vscode-repos'),
    expect.stringContaining('.vscode-node-modules'),
    false,
  )
  expect(mockDispose).toHaveBeenCalled()
  expect(result).toBe('/path/to/built/vscode')
})

test('downloadAndBuildVscodeFromCommit - disposes worker even if invoke fails', async () => {
  const mockLaunch = jest.fn()
  const mockInvoke = jest.fn()
  const mockDispose = jest.fn()

  const mockIpc = {
    dispose: mockDispose,
  }

  // @ts-ignore
  mockLaunch.mockResolvedValue(mockIpc)
  // @ts-ignore
  mockInvoke.mockRejectedValue(new Error('Test error'))

  jest.unstable_mockModule('../src/parts/RepositoryWorker/RepositoryWorker.js', () => ({
    launch: mockLaunch,
  }))

  jest.unstable_mockModule('../src/parts/JsonRpc/JsonRpc.js', () => ({
    invoke: mockInvoke,
  }))

  const { downloadAndBuildVscodeFromCommit } = await import(
    '../src/parts/DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.js'
  )

  await expect(downloadAndBuildVscodeFromCommit('abc123')).rejects.toThrow('Test error')
  expect(mockDispose).toHaveBeenCalled()
})
