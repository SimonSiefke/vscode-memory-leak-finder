import { test, expect } from '@jest/globals'

test('main module exports main function', async () => {
  const Main = await import('../src/parts/Main/Main.js')

  expect(typeof Main.main).toBe('function')
})