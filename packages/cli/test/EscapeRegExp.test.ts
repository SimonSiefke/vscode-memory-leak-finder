import { expect, test } from '@jest/globals'
import * as EscapeRegExp from '../src/parts/EscapeRegExp/EscapeRegExp.ts'

test('escapeRegExp', () => {
  const input: string = 'a.*+?^${}()|[]\\b'
  const escaped: string = EscapeRegExp.escapeRegExp(input)
  expect(escaped).toBe('a\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\b')
})
