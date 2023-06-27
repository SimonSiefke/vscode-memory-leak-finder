import * as PatternUsage from '../src/parts/PatternUsage/PatternUsage.js'

test('print', () => {
  expect(PatternUsage.print()).toBe(
    '\n' +
      '\x1B[1mPattern Mode Usage\x1B[22m\n' +
      ' \x1B[2m› Press\x1B[22m Esc \x1B[2mto exit pattern mode.\x1B[22m\n' +
      ' \x1B[2m› Press\x1B[22m Enter \x1B[2mto filter by a regex pattern.\x1B[22m\n' +
      '\n' +
      '\x1B[2m pattern ›\x1B[22m '
  )
})
