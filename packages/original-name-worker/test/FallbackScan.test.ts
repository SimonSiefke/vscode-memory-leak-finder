import { test, expect } from '@jest/globals'
import { fallbackScan } from '../src/parts/FallbackScan/FallbackScan.ts'

test('fallbackScan - class extends', () => {
  const code = `class extends Test {\n}`
  expect(fallbackScan(code, 0)).toBe('class extends Test')
})

test('fallbackScan - named class', () => {
  const code = `class Foo {\n}`
  expect(fallbackScan(code, 0)).toBe('Foo')
})
