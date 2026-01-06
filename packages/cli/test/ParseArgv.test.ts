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

test('parseArgv - runs', () => {
  const argv = ['--runs', '4']
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

test('parseArgv - explicit --check-leaks takes precedence', () => {
  const argv = ['--check-leaks', '--measure', 'event-listener-count']
  const options = ParseArgv.parseArgv('linux', 'x64', argv)
  expect(options.checkLeaks).toBe(true)
})
