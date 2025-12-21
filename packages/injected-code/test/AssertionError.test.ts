import { test, expect } from '@jest/globals'
import { AssertionError } from '../src/parts/AssertionError/AssertionError.ts'

test('name', () => {
  const error = new AssertionError('expected true to be false')
  expect(error.name).toBe('AssertionError')
})
