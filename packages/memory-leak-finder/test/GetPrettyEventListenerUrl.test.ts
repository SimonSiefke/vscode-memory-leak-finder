import { test, expect } from '@jest/globals'
import * as GetPrettyEventListenerUrl from '../src/parts/GetPrettyEventListenerUrl/GetPrettyEventListenerUrl.ts'

test('vscode url', () => {
  const url = `vscode-file://vscode-app/test/src/file.js`
  expect(GetPrettyEventListenerUrl.getPrettyEventListenerUrl(url)).toBe('file:///test/src/file.js')
})
