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
    platform: 'linux',
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
    platform: 'linux',
    userDataDir: '/tmp/user-data',
  })

  expect(args).not.toContain('--ignore-certificate-errors')
  expect(args).not.toContain('--proxy-bypass-list=<-loopback>;localhost;127.0.0.1;0.0.0.0;::1')
})

test('getVscodeArgs - adds x11 ozone platform only on linux', () => {
  const baseOptions = {
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
  }

  expect(GetVsCodeArgs.getVscodeArgs({ ...baseOptions, platform: 'linux' })).toContain('--ozone-platform=x11')
  expect(GetVsCodeArgs.getVscodeArgs({ ...baseOptions, platform: 'darwin' })).not.toContain('--ozone-platform=x11')
})

test('getVscodeArgs - omits chromium test switches on darwin', () => {
  const baseOptions = {
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
  }

  expect(GetVsCodeArgs.getVscodeArgs({ ...baseOptions, platform: 'linux' })).toContain('--metrics-recording-only')
  expect(GetVsCodeArgs.getVscodeArgs({ ...baseOptions, platform: 'darwin' })).not.toContain('--metrics-recording-only')
})
