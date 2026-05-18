import { expect, test } from '@jest/globals'
import * as Main from '../src/parts/Main/Main.ts'

test('main', () => {
  expect(typeof Main.main).toBe('function')
})
