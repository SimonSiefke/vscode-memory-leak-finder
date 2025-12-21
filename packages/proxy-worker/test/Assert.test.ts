import { expect, test } from '@jest/globals'
import * as Assert from '../src/parts/Assert/Assert.ts'

test('Assert module exports string function', () => {
  expect(typeof Assert.string).toBe('function')
})
