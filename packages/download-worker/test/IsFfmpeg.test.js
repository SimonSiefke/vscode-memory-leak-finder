import { expect, test } from '@jest/globals'
import * as IsFfmpeg from '../src/parts/IsFfmpeg/IsFfmpeg.js'

test('isFfmpeg - false', () => {
  const value = 'abc'
  expect(IsFfmpeg.isFfmpeg(value)).toBe(false)
})

test('isFfmpeg - true', () => {
  const value = 'ffmpeg'
  expect(IsFfmpeg.isFfmpeg(value)).toBe(true)
})
