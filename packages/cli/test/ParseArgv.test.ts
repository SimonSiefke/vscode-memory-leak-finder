import { expect, test } from '@jest/globals'
import { join } from 'node:path'
import * as ParseArgv from '../src/parts/ParseArgv/ParseArgv.ts'
import { root } from '../src/parts/Root/Root.ts'

test('parseArgv - empty', () => {
  const argv: readonly string[] = []
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({})
})

test('parseArgv - watch mode', () => {
  const argv = ['--watch']
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
    watch: true,
  })
})

test('parseArgv - headless mode', () => {
  const argv = ['--headless']
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
    headless: true,
  })
})

test('parseArgv - run skipped tests anyway', () => {
  const argv = ['--run-skipped-tests-anyway']
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
    runSkippedTestsAnyway: true,
  })
})

test('parseArgv - run network tests anyway', () => {
  const argv = ['--run-network-tests-anyway']
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
    runNetworkTestsAnyway: true,
  })
})

test('parseArgv - allow copilot auth in ci', () => {
  const argv = ['--allow-copilot-auth-in-ci']
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
    allowCopilotAuthInCi: true,
  })
})

test('parseArgv - download user data zip file url', () => {
  const argv = ['--download-user-data-zip-file-url', 'https://bot.example.com/api/user-data/download']
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
    downloadUserDataZipFileUrl: 'https://bot.example.com/api/user-data/download',
  })
})

test('parseArgv - download user data zip file token', () => {
  const argv = ['--download-user-data-zip-file-token', 'download-token']
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
    downloadUserDataZipFileToken: 'download-token',
  })
})

test('parseArgv - download user data zip file token from env', () => {
  const previousToken = process.env.DOWNLOAD_USER_DATA_ZIP_FILE_TOKEN
  process.env.DOWNLOAD_USER_DATA_ZIP_FILE_TOKEN = 'download-token-from-env'
  try {
    const argv: readonly string[] = []
    expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
      downloadUserDataZipFileToken: 'download-token-from-env',
    })
  } finally {
    if (typeof previousToken === 'string') {
      process.env.DOWNLOAD_USER_DATA_ZIP_FILE_TOKEN = previousToken
    } else {
      delete process.env.DOWNLOAD_USER_DATA_ZIP_FILE_TOKEN
    }
  }
})

test('parseArgv - download user data zip file url from env', () => {
  const previousUrl = process.env.DOWNLOAD_USER_DATA_ZIP_FILE_URL
  process.env.DOWNLOAD_USER_DATA_ZIP_FILE_URL = 'https://example.com/user-data.zip?X-Amz-Signature=abc123'
  try {
    const argv: readonly string[] = []
    expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
      downloadUserDataZipFileUrl: 'https://example.com/user-data.zip?X-Amz-Signature=abc123',
    })
  } finally {
    if (typeof previousUrl === 'string') {
      process.env.DOWNLOAD_USER_DATA_ZIP_FILE_URL = previousUrl
    } else {
      delete process.env.DOWNLOAD_USER_DATA_ZIP_FILE_URL
    }
  }
})

test('parseArgv - runs uses last value', () => {
  const argv = ['--runs', '1', '--runs', '4']
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
    runs: 4,
  })
})

test('parseArgv - runs', () => {
  const argv = ['--runs', '4']
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
    runs: 4,
  })
})

test('parseArgv - record video', () => {
  const argv = ['--record-video']
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
    recordVideo: true,
  })
})

test('parseArgv - disable vscode node modules cache', () => {
  const argv = ['--disable-vscode-node-modules-cache']
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
    disableVscodeNodeModulesCache: true,
  })
})

test('parseArgv - build vscode minified', () => {
  const argv = ['--build-vscode-minified']
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
    buildVscodeMinified: true,
  })
})

test('parseArgv - build vscode minified not present', () => {
  const argv: readonly string[] = []
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
    buildVscodeMinified: false,
  })
})

test('parseArgv - disable vscode node modules cache not present', () => {
  const argv: readonly string[] = []
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
    disableVscodeNodeModulesCache: false,
  })
})

test('parseArgv - use stable vscode repo path', () => {
  const argv = ['--use-stable-vscode-repo-path']
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
    useStableVscodeRepoPath: true,
  })
})

test('parseArgv - use stable vscode repo path not present', () => {
  const argv: readonly string[] = []
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
    useStableVscodeRepoPath: false,
  })
})

test('parseArgv - compute vscode node modules cache key', () => {
  const argv = ['--compute-vscode-node-modules-cache-key']
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
    computeVscodeNodeModulesCacheKey: true,
  })
})

test('parseArgv - compute vscode node modules cache key not present', () => {
  const argv: readonly string[] = []
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
    computeVscodeNodeModulesCacheKey: false,
  })
})

test('parseArgv - resolve vscode commit hash', () => {
  const argv = ['--resolve-vscode-commit-hash']
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
    resolveVscodeCommitHash: true,
  })
})

test('parseArgv - resolve vscode commit hash not present', () => {
  const argv: readonly string[] = []
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
    resolveVscodeCommitHash: false,
  })
})

test('parseArgv - convert requests to mocks', () => {
  const argv = ['--convert-requests-to-mocks']
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
    convertRequestsToMocks: true,
  })
})

test('parseArgv - create all mock data zip', () => {
  const argv = ['--create-all-mock-data-zip']
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
    createAllMockDataZip: true,
  })
})

test('parseArgv - use proxy mock enables proxy', () => {
  const argv = ['--use-proxy-mock']
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
    enableProxy: true,
    useProxyMock: true,
  })
})

test('parseArgv - cwd', () => {
  const argv = ['--cwd', '/test']
  expect(ParseArgv.parseArgv('linux', 'x64', argv)).toMatchObject({
    cwd: '/test',
  })
})

test('parseArgv - cwd defaults to packages/e2e', () => {
  const argv: readonly string[] = []
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.cwd).toBe(join(root, 'packages/e2e'))
})

test('parseArgv - vscode-path flag', () => {
  const argv = ['--vscode-path', '/path/to/vscode']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.vscodePath).toBe('/path/to/vscode')
})

test('parseArgv - vscode-path flag empty', () => {
  const argv = ['--vscode-path', '']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.vscodePath).toBe('')
})

test('parseArgv - vscode-path flag not present', () => {
  const argv: readonly string[] = []
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.vscodePath).toBe('')
})

test('parseArgv - commit flag', () => {
  const argv = ['--commit', 'abc123']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.commit).toBe('abc123')
})

test('parseArgv - commit flag empty', () => {
  const argv = ['--commit', '']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.commit).toBe('')
})

test('parseArgv - commit flag not present', () => {
  const argv: readonly string[] = []
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.commit).toBe('')
})

test('parseArgv - setup-only flag', () => {
  const argv = ['--setup-only']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.setupOnly).toBe(true)
})

test('parseArgv - setup-only flag not present', () => {
  const argv: readonly string[] = []
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.setupOnly).toBe(false)
})

test('parseArgv - measure-node flag', () => {
  const argv = ['--measure-node']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.measureNode).toBe(true)
})

test('parseArgv - process-root-strategy flag', () => {
  const argv = ['--process-root-strategy', 'ssh-remote-server']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.processRootStrategy).toBe('ssh-remote-server')
})

test('parseArgv - process-root-strategy defaults to launch-pid', () => {
  const argv: readonly string[] = []
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.processRootStrategy).toBe('launch-pid')
})

test('parseArgv - inspect-shared-process flag', () => {
  const argv = ['--inspect-shared-process']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.inspectSharedProcess).toBe(true)
})

test('parseArgv - inspect-shared-process flag not present', () => {
  const argv: readonly string[] = []
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.inspectSharedProcess).toBe(false)
})

test('parseArgv - inspect-extensions flag', () => {
  const argv = ['--inspect-extensions']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.inspectExtensions).toBe(true)
})

test('parseArgv - inspect-extensions flag not present', () => {
  const argv: readonly string[] = []
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.inspectExtensions).toBe(false)
})

test('parseArgv - inspect-ptyhost flag', () => {
  const argv = ['--inspect-ptyhost']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.inspectPtyHost).toBe(true)
})

test('parseArgv - inspect-ptyhost flag not present', () => {
  const argv: readonly string[] = []
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.inspectPtyHost).toBe(false)
})

test('parseArgv - inspect-integrated-browser flag', () => {
  const argv = ['--inspect-integrated-browser']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.inspectIntegratedBrowser).toBe(true)
})

test('parseArgv - inspect-integrated-browser flag not present', () => {
  const argv: readonly string[] = []
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.inspectIntegratedBrowser).toBe(false)
})

test('parseArgv - inspect-process flag', () => {
  const argv = ['--inspect-process', 'vite.js']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.inspectProcess).toBe('vite.js')
})

test('parseArgv - inspect-process flag not present', () => {
  const argv: readonly string[] = []
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.inspectProcess).toBe('')
})

test('parseArgv - inspect-integrated-browser rejects other measure targets', () => {
  const argv = ['--inspect-integrated-browser', '--inspect-extensions']
  expect(() => ParseArgv.parseArgv('linux', 'x64', argv)).toThrow(
    '--inspect-integrated-browser cannot be combined with --measure-node, --inspect-shared-process, --inspect-extensions, --inspect-ptyhost, or --inspect-process',
  )
})

test('parseArgv - inspect-integrated-browser rejects inspect-process target', () => {
  const argv = ['--inspect-integrated-browser', '--inspect-process', 'vite.js']
  expect(() => ParseArgv.parseArgv('linux', 'x64', argv)).toThrow(
    '--inspect-integrated-browser cannot be combined with --measure-node, --inspect-shared-process, --inspect-extensions, --inspect-ptyhost, or --inspect-process',
  )
})

test('parseArgv - enable-extensions flag', () => {
  const argv = ['--enable-extensions']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.enableExtensions).toBe(true)
})

test('parseArgv - enable-extensions flag not present', () => {
  const argv: readonly string[] = []
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.enableExtensions).toBe(false)
})

test('parseArgv - inspect-ptyhost-port flag', () => {
  const argv = ['--inspect-ptyhost-port', '9999']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.inspectPtyHostPort).toBe(9999)
})

test('parseArgv - inspect-ptyhost-port flag not present', () => {
  const argv: readonly string[] = []
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.inspectPtyHostPort).toBe(5877)
})

test('parseArgv - inspect-shared-process-port flag', () => {
  const argv = ['--inspect-shared-process-port', '8888']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.inspectSharedProcessPort).toBe(8888)
})

test('parseArgv - inspect-shared-process-port flag not present', () => {
  const argv: readonly string[] = []
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.inspectSharedProcessPort).toBe(5879)
})

test('parseArgv - inspect-extensions-port flag', () => {
  const argv = ['--inspect-extensions-port', '7777']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.inspectExtensionsPort).toBe(7777)
})

test('parseArgv - inspect-extensions-port flag not present', () => {
  const argv: readonly string[] = []
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.inspectExtensionsPort).toBe(5870)
})

test('parseArgv - inspect ports with invalid number', () => {
  const argv = ['--inspect-ptyhost-port', 'invalid']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.inspectPtyHostPort).toBe(1)
})

test('parseArgv - multiple inspect flags and ports', () => {
  const argv = [
    '--inspect-shared-process',
    '--inspect-shared-process-port',
    '8888',
    '--inspect-extensions',
    '--inspect-extensions-port',
    '7777',
    '--inspect-ptyhost',
    '--inspect-ptyhost-port',
    '9999',
  ]
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.inspectSharedProcess).toBe(true)
  expect(options.inspectSharedProcessPort).toBe(8888)
  expect(options.inspectExtensions).toBe(true)
  expect(options.inspectExtensionsPort).toBe(7777)
  expect(options.inspectPtyHost).toBe(true)
  expect(options.inspectPtyHostPort).toBe(9999)
})

test('parseArgv - vscode-version with insiders format', () => {
  const argv = ['--vscode-version', 'insiders:dojdideiheuh']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.vscodeVersion).toBe('')
  expect(options.insidersCommit).toBe('dojdideiheuh')
})

test('parseArgv - vscode-version with insiders format and different commit hash', () => {
  const argv = ['--vscode-version', 'insiders:abc123def456']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.vscodeVersion).toBe('')
  expect(options.insidersCommit).toBe('abc123def456')
})

test('parseArgv - vscode-version with regular version', () => {
  const argv = ['--vscode-version', '1.80.0']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.vscodeVersion).toBe('1.80.0')
  expect(options.insidersCommit).toBe('')
})

test('parseArgv - vscode-version with insiders format and empty commit', () => {
  const argv = ['--vscode-version', 'insiders:']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.vscodeVersion).toBe('')
  expect(options.insidersCommit).toBe('')
})

test('parseArgv - vscode-version with insiders format does not override explicit insiders-commit', () => {
  const argv = ['--vscode-version', 'insiders:dojdideiheuh', '--insiders-commit', 'othercommit']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.vscodeVersion).toBe('')
  expect(options.insidersCommit).toBe('othercommit')
})

test('parseArgv - only flag', () => {
  const argv = ['--only', 'editor-open']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.filter).toBe('editor-open')
})

test('parseArgv - only flag not present', () => {
  const argv: readonly string[] = []
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.filter).toBe('')
})

test('parseArgv - only flag empty', () => {
  const argv = ['--only', '']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.filter).toBe('')
})

test('parseArgv - only flag replaces dots with dashes for backwards compatibility', () => {
  const argv = ['--only', 'editor.open']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.filter).toBe('editor-open')
})

test('parseArgv - only flag replaces multiple dots with dashes', () => {
  const argv = ['--only', 'activity-bar.switch-views']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.filter).toBe('activity-bar-switch-views')
})

test('parseArgv - only flag replaces all dots in complex pattern', () => {
  const argv = ['--only', 'explorer.fs-rename-file']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.filter).toBe('explorer-fs-rename-file')
})

test('parseArgv - only flag with value that already has dashes', () => {
  const argv = ['--only', 'editor-open-many-tabs']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.filter).toBe('editor-open-many-tabs')
})

test('parseArgv - check-leaks flag', () => {
  const argv = ['--check-leaks']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.checkLeaks).toBe(true)
})

test('parseArgv - check-leaks flag not present', () => {
  const argv: readonly string[] = []
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.checkLeaks).toBe(false)
})

test('parseArgv - check-leaks automatically true when --measure is specified', () => {
  const argv = ['--measure', 'event-listener-count']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.checkLeaks).toBe(true)
})

test('parseArgv - check-leaks automatically true when --measure is specified with any value', () => {
  const argv = ['--measure', 'heap-usage']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.checkLeaks).toBe(true)
})

test('parseArgv - tracked allocations enables tracking transform', () => {
  const argv = ['--measure', 'tracked-allocations']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.trackFunctions).toBe(true)
})

test('parseArgv - explicit --check-leaks takes precedence', () => {
  const argv = ['--check-leaks', '--measure', 'event-listener-count']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.checkLeaks).toBe(true)
})
