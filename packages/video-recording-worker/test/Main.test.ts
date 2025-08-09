import { expect, test } from '@jest/globals'
import * as Main from '../src/parts/Main/Main.ts'

test('main function exists', () => {
  expect(typeof Main.main).toBe('function')
})

test('main should not throw when called', async () => {
  await expect(Main.main()).resolves.toBeUndefined()
})
