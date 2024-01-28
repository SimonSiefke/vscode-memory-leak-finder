import * as PatternUsage from '../src/parts/PatternUsage/PatternUsage.js'

test('print', () => {
  expect(PatternUsage.print()).toBe(
    '\n' +
      '\u001B[1mPattern Mode Usage\u001B[22m\n' +
      ' \u001B[2m› Press\u001B[22m Esc \u001B[2mto exit pattern mode.\u001B[22m\n' +
      ' \u001B[2m› Press\u001B[22m Enter \u001B[2mto filter by a regex pattern.\u001B[22m\n' +
      '\n' +
      '\u001B[2m pattern ›\u001B[22m '
  )
})
