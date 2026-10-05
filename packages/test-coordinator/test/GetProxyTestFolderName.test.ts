import { expect, test } from '@jest/globals'
import * as GetProxyTestFolderName from '../src/parts/GetProxyTestFolderName/GetProxyTestFolderName.ts'

test('getProxyTestFolderName - strips ts extension', () => {
  expect(GetProxyTestFolderName.getProxyTestFolderName('/workspace/packages/e2e/src/editor-open.ts')).toBe('editor-open')
})

test('getProxyTestFolderName - strips js extension', () => {
  expect(GetProxyTestFolderName.getProxyTestFolderName('/workspace/packages/e2e/src/debug-javascript.js')).toBe('debug-javascript')
})
