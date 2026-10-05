import { expect, test } from '@jest/globals'
import { join } from 'node:path'
import * as GetProxyPaths from '../src/parts/GetProxyPaths/GetProxyPaths.ts'
import * as ProxyState from '../src/parts/ProxyState/ProxyState.ts'
import * as Root from '../src/parts/Root/Root.ts'

test('getRequestsDir - returns scoped directory when test folder is set', () => {
  ProxyState.setTestFolderName('editor-open')

  expect(GetProxyPaths.getRequestsDir()).toBe(join(Root.root, '.vscode-requests', 'editor-open'))
})

test('getMockRequestsDir - returns scoped directory when test folder is set', () => {
  ProxyState.setTestFolderName('editor-open')

  expect(GetProxyPaths.getMockRequestsDir()).toBe(join(Root.root, '.vscode-mock-requests', 'editor-open'))
})

test('getImageDataDir - returns base directory when test folder is cleared', () => {
  ProxyState.setTestFolderName('')

  expect(GetProxyPaths.getImageDataDir()).toBe(join(Root.root, '.vscode-image-data'))
})
