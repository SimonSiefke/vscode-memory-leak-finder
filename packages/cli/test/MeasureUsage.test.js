import * as MeasureUsage from '../src/parts/MeasureUsage/MeasureUsage.js'

test('print', () => {
  expect(MeasureUsage.print()).toBe(
    '\n' +
      '\x1B[1mMeasure Mode Usage\x1B[22m\n' +
      ' \x1B[2m› Press\x1B[22m Esc \x1B[2mto exit measure mode.\x1B[22m\n' +
      ' \x1B[2m› Press\x1B[22m Enter \x1B[2mto use this measure.\x1B[22m\n' +
      '\n' +
      '\x1B[2m measure ›\x1B[22m ',
  )
})
