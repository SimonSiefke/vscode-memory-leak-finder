import * as LoadSourceMapFromDataUrl from '../src/parts/LoadSourceMapFromDataUrl/LoadSourceMapFromData.js'

test('loadSourceMapFromDataUrl', () => {
  const dataUrl = `data:application/json;base64,eyB9`
  expect(LoadSourceMapFromDataUrl.loadSourceMap(dataUrl)).toEqual({})
})

test('loadSourceMapFromDataUrl - invalid json', () => {
  const dataUrl = `data:application/json;base64,abc`
  expect(() => LoadSourceMapFromDataUrl.loadSourceMap(dataUrl)).toThrow(new Error(`Unexpected token i in JSON at position 0`))
})
