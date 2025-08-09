import { AssertionError } from '../src/parts/AssertionError/AssertionError.ts'
import { test, expect } from '@jest/globals'

test('name', () => {
  const error = new AssertionError('expected true to be false')
  expect(error.name).toBe('AssertionError')
})
