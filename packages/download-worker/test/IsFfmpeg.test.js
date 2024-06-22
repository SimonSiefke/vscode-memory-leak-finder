import { expect, test } from '@jest/globals'
import * as IsFfmpeg from '../src/parts/IsFfmpeg/IsFfmpeg.js'

test('isFfmpeg - false', () => {
  const tool = {
    name: 'abc',
  }
  expect(IsFfmpeg.isFfmpeg(tool)).toBe(false)
})

test('isFfmpeg - true', () => {
  const tool = {
    name: 'ffmpeg',
  }
  expect(IsFfmpeg.isFfmpeg(tool)).toBe(true)
})
