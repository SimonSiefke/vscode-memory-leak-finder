import * as WatchUsage from '../src/parts/WatchUsage/WatchUsage.js'

test('print', () => {
  expect(WatchUsage.print()).toBe(
    '\n' +
      '\x1B[1mWatch Usage\x1B[22m\n' +
      '\x1B[2m › Press \x1B[22ma\x1B[2m to run all tests.\x1B[22m\n' +
      '\x1B[2m › Press \x1B[22mf\x1B[2m to run only failed tests.\x1B[22m\n' +
      '\x1B[2m › Press \x1B[22mp\x1B[2m to filter tests by a filename regex pattern.\x1B[22m\n' +
      '\x1B[2m › Press \x1B[22mh\x1B[2m to toggle headless mode.\x1B[22m\n' +
      '\x1B[2m › Press \x1B[22mq\x1B[2m to quit watch mode.\x1B[22m\n' +
      '\x1B[2m › Press \x1B[22mEnter\x1B[2m to trigger a test run.\x1B[22m\n'
  )
})
