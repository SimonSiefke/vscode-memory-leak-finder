import { expect, test } from '@jest/globals'
import * as WatchUsage from '../src/parts/GetWatchUsageMessage/GetWatchUsageMessage.ts'

test('print', () => {
  expect(WatchUsage.getWatchUsageMessage()).toBe(
    '\n' +
      '\u{1B}[1mWatch Usage\u{1B}[22m\n' +
      '\u{1B}[2m › Press \u{1B}[22ma\u{1B}[2m to run all tests.\u{1B}[22m\n' +
      '\u{1B}[2m › Press \u{1B}[22mf\u{1B}[2m to run only failed tests.\u{1B}[22m\n' +
      '\u{1B}[2m › Press \u{1B}[22mp\u{1B}[2m to filter tests by a filename regex pattern.\u{1B}[22m\n' +
      '\u{1B}[2m › Press \u{1B}[22mh\u{1B}[2m to toggle headless mode.\u{1B}[22m\n' +
      '\u{1B}[2m › Press \u{1B}[22mq\u{1B}[2m to quit watch mode.\u{1B}[22m\n' +
      '\u{1B}[2m › Press \u{1B}[22mEnter\u{1B}[2m to trigger a test run.\u{1B}[22m\n',
  )
})
