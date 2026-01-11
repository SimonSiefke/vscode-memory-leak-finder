import { expect, test } from '@jest/globals'
import * as GetExecutablePath from '../src/parts/GetExecutablePath/GetExecutablePath.ts'

test('getExecutablePath returns path for ffmpeg', () => {
  const platform = 'linux'
  const result = GetExecutablePath.getExecutablePath(platform, 'ffmpeg')
  expect(Array.isArray(result)).toBe(true)
  expect(result.length).toBeGreaterThan(0)
})

test('getExecutablePath returns darwin path', () => {
  const platform = 'darwin'
  const result = GetExecutablePath.getExecutablePath(platform, 'ffmpeg')
  expect(result[0]).toBe('ffmpeg-mac')
})

test('getExecutablePath returns linux path', () => {
  const platform = 'linux'
  const result = GetExecutablePath.getExecutablePath(platform, 'ffmpeg')
  expect(result[0]).toBe('ffmpeg-linux')
})

test('getExecutablePath returns win32 path', () => {
  const platform = 'win32'
  const result = GetExecutablePath.getExecutablePath(platform, 'ffmpeg')
  expect(result[0]).toBe('ffmpeg-win64.exe')
})
