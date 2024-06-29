import { expect, test } from '@jest/globals'
import * as WatchUsageShort from '../src/parts/WatchUsageShort/WatchUsageShort.js'

test('print', () => {
  expect(WatchUsageShort.print()).toBe(`\n\u001B[1mWatch Usage: \u001B[22m\u001B[2mPress \u001B[22mw\u001B[2m to show more.\u001B[22m`)
})
