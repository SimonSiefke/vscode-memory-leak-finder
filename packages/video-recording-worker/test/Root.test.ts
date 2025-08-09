import { expect, test } from '@jest/globals'
import * as Root from '../src/parts/Root/Root.ts'

test('root path is a string', () => {
  expect(typeof Root.root).toBe('string')
  expect(Root.root.length).toBeGreaterThan(0)
})

test('root path is absolute', () => {
  expect(Root.root.startsWith('/')).toBe(true)
})
