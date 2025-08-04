import { expect, test } from '@jest/globals'

const TestPrefixText = await import('../src/parts/TestPrefixText/TestPrefixText.js')

test('TestPrefixText exports - should have all expected prefix texts', () => {
  expect(TestPrefixText.Pass).toBe(' PASS ')
  expect(TestPrefixText.Leak).toBe(' LEAK ')
  expect(TestPrefixText.Runs).toBe(' RUNS ')
  expect(TestPrefixText.Setup).toBe(' SETUP ')
  expect(TestPrefixText.Fail).toBe(' FAIL ')
  expect(TestPrefixText.UnexpectedError).toBe(' Unexpected Error ')
})

test('TestPrefixText.Setup - should be correctly formatted', () => {
  expect(TestPrefixText.Setup).toBe(' SETUP ')
  expect(TestPrefixText.Setup).toHaveLength(7)
  expect(TestPrefixText.Setup.startsWith(' ')).toBe(true)
  expect(TestPrefixText.Setup.endsWith(' ')).toBe(true)
})
