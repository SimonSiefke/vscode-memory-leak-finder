import { expect, test } from '@jest/globals'
import * as ScreencastQuality from '../src/parts/ScreencastQuality/ScreencastQuality.ts'

test('screencastQuality', () => {
  expect(ScreencastQuality.screencastQuality).toBe(90)
  expect(typeof ScreencastQuality.screencastQuality).toBe('number')
  expect(ScreencastQuality.screencastQuality >= 0).toBe(true)
  expect(ScreencastQuality.screencastQuality <= 100).toBe(true)
})
