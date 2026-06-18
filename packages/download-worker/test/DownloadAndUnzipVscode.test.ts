import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'

const mockDownloadAndUnzipVSCode = jest.fn<(options: { readonly cachePath: string; readonly version: string }) => Promise<string>>()
const mockGetVscodeRuntimePath = jest.fn<(vscodeVersion: string, platform: string, arch: string) => Promise<string>>()
const mockSetVscodeRuntimePath = jest.fn<(vscodeVersion: string, path: string, platform: string, arch: string) => Promise<void>>()
const mockGetProductJsonPath = jest.fn<(platform: string, path: string) => string>()
const mockReadJson = jest.fn<(path: string) => Promise<Record<string, unknown>>>()
const mockWriteJson = jest.fn<(path: string, json: Record<string, unknown>) => Promise<void>>()
const mockRemoveUnusedFiles = jest.fn<(platform: string, binaryPath: string) => Promise<void>>()

const originalVscodePath = process.env.VSCODE_PATH

jest.unstable_mockModule('@vscode/test-electron', () => ({
  downloadAndUnzipVSCode: mockDownloadAndUnzipVSCode,
}))

jest.unstable_mockModule('../src/parts/GetVscodeRuntimePath/GetVscodeRuntimePath.ts', () => ({
  getVscodeRuntimePath: mockGetVscodeRuntimePath,
  setVscodeRuntimePath: mockSetVscodeRuntimePath,
}))

jest.unstable_mockModule('../src/parts/GetProductJsonPath/GetProductJsonPath.ts', () => ({
  getProductJsonPath: mockGetProductJsonPath,
}))

jest.unstable_mockModule('../src/parts/JsonFile/JsonFile.ts', () => ({
  readJson: mockReadJson,
  writeJson: mockWriteJson,
}))

jest.unstable_mockModule('../src/parts/RemoveUnusedFiles/RemoveUnusedFiles.ts', () => ({
  removeUnusedFiles: mockRemoveUnusedFiles,
}))

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
  delete process.env.VSCODE_PATH
  mockGetVscodeRuntimePath.mockResolvedValue('')
  mockSetVscodeRuntimePath.mockResolvedValue()
  mockGetProductJsonPath.mockReturnValue('/vscode/product.json')
  mockReadJson.mockResolvedValue({})
  mockWriteJson.mockResolvedValue()
  mockRemoveUnusedFiles.mockResolvedValue()
})

afterEach(() => {
  process.env.VSCODE_PATH = originalVscodePath
})

test('downloadAndUnzipVscode - retries ECONNRESET up to three times', async () => {
  const resetError = Object.assign(new Error('read ECONNRESET'), {
    code: 'ECONNRESET',
  })
  mockDownloadAndUnzipVSCode.mockRejectedValueOnce(resetError)
  mockDownloadAndUnzipVSCode.mockRejectedValueOnce(resetError)
  mockDownloadAndUnzipVSCode.mockRejectedValueOnce(resetError)
  mockDownloadAndUnzipVSCode.mockResolvedValue('/vscode/code')

  const { downloadAndUnzipVscode } = await import('../src/parts/DownloadAndUnzipVscode/DownloadAndUnzipVscode.ts')
  const result = await downloadAndUnzipVscode({
    arch: 'x64',
    insidersCommit: '',
    platform: 'linux',
    updateUrl: '',
    vscodeVersion: '1.100.0',
  })

  expect(result).toBe('/vscode/code')
  expect(mockDownloadAndUnzipVSCode).toHaveBeenCalledTimes(4)
  expect(mockSetVscodeRuntimePath).toHaveBeenCalledWith('1.100.0', '/vscode/code', 'linux', 'x64')
})

test('downloadAndUnzipVscode - does not retry other download errors', async () => {
  const error = Object.assign(new Error('getaddrinfo ENOTFOUND'), {
    code: 'ENOTFOUND',
  })
  mockDownloadAndUnzipVSCode.mockRejectedValue(error)

  const { downloadAndUnzipVscode } = await import('../src/parts/DownloadAndUnzipVscode/DownloadAndUnzipVscode.ts')
  await expect(
    downloadAndUnzipVscode({
      arch: 'x64',
      insidersCommit: '',
      platform: 'linux',
      updateUrl: '',
      vscodeVersion: '1.100.0',
    }),
  ).rejects.toThrow('Failed to download VSCode')

  expect(mockDownloadAndUnzipVSCode).toHaveBeenCalledTimes(1)
})
