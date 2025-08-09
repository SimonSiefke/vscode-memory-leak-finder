import { expect, test } from '@jest/globals'

test('main module loads without error', async () => {
  expect(() => require('../src/main.ts')).not.toThrow()
})
