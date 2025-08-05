import { test, expect } from '@jest/globals'

test('main module exports main function', async () => {
  const Main = await import('../src/parts/Main/Main.ts')

  expect(typeof Main.main).toBe('function')
})
