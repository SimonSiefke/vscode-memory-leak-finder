import * as WatchUsageShort from '../src/parts/WatchUsageShort/WatchUsageShort.js'

test('print', () => {
  expect(WatchUsageShort.print()).toBe(`\n\x1B[1mWatch Usage: \x1B[22m\x1B[2mPress \x1B[22mw\x1B[2m to show more.\x1B[22m`)
})
