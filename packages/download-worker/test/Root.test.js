import { expect, test } from '@jest/globals'
import * as Root from '../src/parts/Root/Root.js'

test('root', () => {
  expect(typeof Root.root).toBe('string')
})
