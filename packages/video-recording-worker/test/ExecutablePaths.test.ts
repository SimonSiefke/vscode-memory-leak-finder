import { expect, test } from '@jest/globals'
import * as ExecutablePaths from '../src/parts/ExecutablePaths/ExecutablePaths.ts'

test('ffmpeg executable paths are defined', () => {
  expect(typeof ExecutablePaths.ffmpeg).toBe('object')
  expect(ExecutablePaths.ffmpeg).toBeDefined()
})

test('ffmpeg has linux path', () => {
  expect(Array.isArray(ExecutablePaths.ffmpeg.linux)).toBe(true)
  expect(ExecutablePaths.ffmpeg.linux.length).toBeGreaterThan(0)
  expect(ExecutablePaths.ffmpeg.linux[0]).toBe('ffmpeg-linux')
})

test('ffmpeg has mac path', () => {
  expect(Array.isArray(ExecutablePaths.ffmpeg.mac)).toBe(true)
  expect(ExecutablePaths.ffmpeg.mac.length).toBeGreaterThan(0)
  expect(ExecutablePaths.ffmpeg.mac[0]).toBe('ffmpeg-mac')
})

test('ffmpeg has windows path', () => {
  expect(Array.isArray(ExecutablePaths.ffmpeg.win)).toBe(true)
  expect(ExecutablePaths.ffmpeg.win.length).toBeGreaterThan(0)
  expect(ExecutablePaths.ffmpeg.win[0]).toBe('ffmpeg-win64.exe')
})
