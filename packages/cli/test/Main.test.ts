import { expect, test } from '@jest/globals'
import * as Main from '../src/parts/Main/Main.ts'

test('main', () => {
  expect(Main.main).toBeDefined()
})
