import { DevtoolsProtocolError } from '../src/parts/DevtoolsProtocolError/DevtoolsProtocolError.js'
import * as IsDevtoolsCannotFindContextError from '../src/parts/IsDevtoolsCannotFindContextError/IsDevtoolsCannotFindContextError.js'

test('isDevtoolsCannotFindContextError - uniqueContextId', () => {
  const error = new DevtoolsProtocolError(`uniqueContextId not found`)
  expect(IsDevtoolsCannotFindContextError.isDevtoolsCannotFindContextError(error)).toBe(true)
})
