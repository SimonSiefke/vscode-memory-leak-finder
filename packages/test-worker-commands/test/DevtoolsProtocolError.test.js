import { DevtoolsProtocolError } from '../src/parts/DevtoolsProtocolError/DevtoolsProtocolError.js'

test('DevtoolsProtocolError - TypeError', () => {
  const error = new DevtoolsProtocolError(`TypeError: Cannot read properties of null (reading 'style')
    at <anonymous>:1:29`)
  expect(error.message).toBe(`TypeError: Cannot read properties of null (reading 'style')`)
  expect(error.stack).toMatch(`TypeError: Cannot read properties of null (reading 'style')
    at dist/injectedCode.js:1:29`)
})
