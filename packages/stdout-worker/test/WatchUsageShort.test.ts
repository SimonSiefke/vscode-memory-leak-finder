import { expect, test } from '@jest/globals'
import * as WatchUsageShort from '../src/parts/GetWatchUsageMessageShort/GetWatchUsageMessageShort.ts'

test('print', () => {
  expect(WatchUsageShort.getWatchUsageMessageShort()).toBe(
    `\n\u{1B}[1mWatch Usage: \u{1B}[22m\u{1B}[2mPress \u{1B}[22mw\u{1B}[2m to show more.\u{1B}[22m`,
  )
})
