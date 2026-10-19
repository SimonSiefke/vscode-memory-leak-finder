import { expect, test } from '@jest/globals'
import * as GetVsCodeArgs from '../src/parts/GetVsCodeArgs/GetVsCodeArgs.ts'

test('getVscodeArgs - adds loopback proxy bypass arguments when proxy is enabled', () => {
  const args = GetVsCodeArgs.getVscodeArgs({
    enableExtensions: true,
    enableProxy: true,
    extensionsDir: '/tmp/extensions',
    extraLaunchArgs: ['/tmp/workspace'],
    inspectExtensions: false,
    inspectExtensionsPort: 0,
    inspectPtyHost: false,
    inspectPtyHostPort: 0,
    inspectSharedProcess: false,
    inspectSharedProcessPort: 0,
    userDataDir: '/tmp/user-data',
  })

  expect(args).toContain('--ignore-certificate-errors')
  expect(args).toContain('--proxy-bypass-list=<-loopback>;localhost;127.0.0.1;0.0.0.0;::1')
})

test('getVscodeArgs - does not add loopback proxy bypass arguments when proxy is disabled', () => {
  const args = GetVsCodeArgs.getVscodeArgs({
    enableExtensions: true,
    enableProxy: false,
    extensionsDir: '/tmp/extensions',
    extraLaunchArgs: ['/tmp/workspace'],
    inspectExtensions: false,
    inspectExtensionsPort: 0,
    inspectPtyHost: false,
    inspectPtyHostPort: 0,
    inspectSharedProcess: false,
    inspectSharedProcessPort: 0,
    userDataDir: '/tmp/user-data',
  })

  expect(args).not.toContain('--ignore-certificate-errors')
  expect(args).not.toContain('--proxy-bypass-list=<-loopback>;localhost;127.0.0.1;0.0.0.0;::1')
})

test.each([
  [true, true],
  [true, false],
  [false, true],
  [false, false],
])('getVscodeArgs - Agents launch %s with mocks %s', (launchAgentWindow, useProxyMock) => {
  const args = GetVsCodeArgs.getVscodeArgs({
    enableExtensions: true,
    enableProxy: true,
    launchAgentWindow,
    useProxyMock,
    extensionsDir: '/tmp/test extensions',
    extraLaunchArgs: ['/tmp/workspace'],
    inspectExtensions: false,
    inspectExtensionsPort: 0,
    inspectPtyHost: false,
    inspectPtyHostPort: 0,
    inspectSharedProcess: false,
    inspectSharedProcessPort: 0,
    userDataDir: '/tmp/test profile',
  })
  const agentsArgs = [
    '--agents',
    '--skip-sessions-welcome',
    '--agents-user-data-dir=/tmp/test profile',
    '--agents-extensions-dir=/tmp/test extensions',
  ]
  for (const arg of agentsArgs) {
    expect(args.includes(arg)).toBe(launchAgentWindow)
  }
  expect(args.includes('--enable-smoke-test-driver')).toBe(launchAgentWindow && useProxyMock)
  expect(args).toContain('/tmp/workspace')
  expect(args).not.toContain('--new-window')
})
