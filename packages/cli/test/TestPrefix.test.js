import { expect, test } from '@jest/globals'

const TestPrefix = await import('../src/parts/TestPrefix/TestPrefix.js')

test('TestPrefix exports - should have all expected styled prefixes', () => {
  expect(typeof TestPrefix.Pass).toBe('string')
  expect(typeof TestPrefix.Leak).toBe('string')
  expect(typeof TestPrefix.Runs).toBe('string')
  expect(typeof TestPrefix.Setup).toBe('string')
  expect(typeof TestPrefix.Fail).toBe('string')
  expect(typeof TestPrefix.UnexpectedError).toBe('string')
})

test('TestPrefix.Setup - should contain SETUP text with yellow styling', () => {
  expect(TestPrefix.Setup).toContain('SETUP')
  expect(TestPrefix.Setup).toContain('\u001B[33m') // yellow color code
  expect(TestPrefix.Setup).toContain('\u001B[7m') // inverse style
})

test('TestPrefix styled prefixes - should all contain inverse styling', () => {
  expect(TestPrefix.Pass).toContain('\u001B[7m')
  expect(TestPrefix.Leak).toContain('\u001B[7m')
  expect(TestPrefix.Runs).toContain('\u001B[7m')
  expect(TestPrefix.Setup).toContain('\u001B[7m')
  expect(TestPrefix.Fail).toContain('\u001B[7m')
  expect(TestPrefix.UnexpectedError).toContain('\u001B[7m')
})
