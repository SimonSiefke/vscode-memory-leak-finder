import { expect, test } from '@jest/globals'
import { DevtoolsProtocolError } from '../src/parts/DevtoolsProtocolError/DevtoolsProtocolError.ts'
import * as IsDevtoolsCannotFindContextError from '../src/parts/IsDevtoolsCannotFindContextError/IsDevtoolsCannotFindContextError.ts'

test('isDevtoolsCannotFindContextError - uniqueContextId', () => {
  const error = new DevtoolsProtocolError(`uniqueContextId not found`)
  expect(IsDevtoolsCannotFindContextError.isDevtoolsCannotFindContextError(error)).toBe(true)
})
