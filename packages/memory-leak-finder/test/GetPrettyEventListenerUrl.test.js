import * as GetPrettyEventListenerUrl from '../src/parts/GetPrettyEventListenerUrl/GetPrettyEventListenerUrl.js'

test('vscode url', () => {
  const url = `vscode-file://vscode-app/test/src/file.js`
  expect(GetPrettyEventListenerUrl.getPrettyEventListenerUrl(url)).toBe('file:///test/src/file.js')
})
