import { beforeEach, expect, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
  jest.clearAllMocks()
})

jest.unstable_mockModule('../src/parts/FetchVscodeInsidersMetadata/FetchVscodeInsidersMetadata.ts', () => {
  return {
    fetchVscodeInsidersMetadata: jest.fn(),
  }
})

jest.unstable_mockModule('../src/parts/GetVscodeVersionFromPath/GetVscodeVersionFromPath.ts', () => {
  return {
    getVscodeVersionFromPath: jest.fn(() => '1.130.0'),
  }
})

jest.unstable_mockModule('../src/parts/LaunchCursor/LaunchCursor.ts', () => {
  return {
    launchCursor: jest.fn(),
  }
})

jest.unstable_mockModule('../src/parts/LaunchVsCode/LaunchVsCode.ts', () => {
  return {
    launchVsCode: jest.fn(async () => {
      return {
        binaryPath: '/home/simon/.cache/repos/vscode/scripts/code.sh',
        child: { pid: 1234 },
        pid: 1234,
      }
    }),
  }
})

jest.unstable_mockModule('../src/parts/ParseVersion/ParseVersion.ts', () => {
  return {
    parseVersion: jest.fn((version: string) => {
      const [major, minor, patch] = version.split('.').map((part) => Number.parseInt(part))
      return {
        major,
        minor,
        patch,
      }
    }),
  }
})

const LaunchCursor = await import('../src/parts/LaunchCursor/LaunchCursor.ts')
const LaunchVsCode = await import('../src/parts/LaunchVsCode/LaunchVsCode.ts')
const LaunchIde = await import('../src/parts/LaunchIde/LaunchIde.ts')

test('launchIde - uses local vscode path version for parsedVersion', async () => {
  const result = await LaunchIde.launchIde({
    addDisposable() {},
    arch: 'x64',
    clearExtensions: false,
    commit: '',
    cwd: '/workspace',
    enableExtensions: false,
    enableProxy: false,
    headlessMode: true,
    ide: 'vscode',
    insidersCommit: '',
    inspectExtensions: false,
    inspectExtensionsPort: 5870,
    inspectPtyHost: false,
    inspectPtyHostPort: 5877,
    inspectSharedProcess: false,
    inspectSharedProcessPort: 5879,
    platform: 'linux',
    updateUrl: 'https://update.code.visualstudio.com',
    useProxyMock: false,
    vscodePath: '/home/simon/.cache/repos/vscode/scripts/code.sh',
    vscodeVersion: '1.119.0',
  })

  expect(result.parsedVersion).toEqual({
    major: 1,
    minor: 130,
    patch: 0,
  })
  expect(LaunchCursor.launchCursor).not.toHaveBeenCalled()
  expect(LaunchVsCode.launchVsCode).toHaveBeenCalledWith(
    expect.objectContaining({
      vscodePath: '/home/simon/.cache/repos/vscode/scripts/code.sh',
      vscodeVersion: '1.119.0',
    }),
  )
})
