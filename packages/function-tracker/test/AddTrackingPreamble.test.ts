import { test, expect } from '@jest/globals'
import { addTrackingPreamble } from '../src/parts/AddTrackingPreamble/AddTrackingPreamble.js'
import { trackingCode } from '../src/parts/TrackingCode/TrackingCode.ts'

test('AddTrackingPreamble - should add tracking preamble to simple function', async () => {
  const code = `
function testFunction() {
  return 'test'
}
`

  const result = addTrackingPreamble(code)

  const expected = trackingCode + '\n' + code

  expect(result).toBe(expected)
})
