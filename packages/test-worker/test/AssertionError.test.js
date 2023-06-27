import { AssertionError } from '../src/parts/AssertionError/AssertionError.js'

test('name', () => {
  const error = new AssertionError('expected true to be false')
  expect(error.name).toBe('AssertionError')
})
