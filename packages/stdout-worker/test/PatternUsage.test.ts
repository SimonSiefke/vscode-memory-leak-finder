import { expect, test } from '@jest/globals'
import * as PatternUsage from '../src/parts/GetPatternUsageMessage/GetPatternUsageMessage.ts'

test('print', () => {
  expect(PatternUsage.getPatternUsageMessage()).toBe(
    '\n' +
      '\u{1B}[1mPattern Mode Usage\u{1B}[22m\n' +
      ' \u{1B}[2m› Press\u{1B}[22m Esc \u{1B}[2mto exit pattern mode.\u{1B}[22m\n' +
      ' \u{1B}[2m› Press\u{1B}[22m Enter \u{1B}[2mto filter by a regex pattern.\u{1B}[22m\n' +
      '\n' +
      '\u{1B}[2m pattern ›\u{1B}[22m ',
  )
})
