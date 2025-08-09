import { expect, test } from '@jest/globals'
import * as GetExecutablePath from '../src/parts/GetExecutablePath/GetExecutablePath.ts'

test('getExecutablePath returns path for ffmpeg', () => {
  const result = GetExecutablePath.getExecutablePath('ffmpeg')
  expect(Array.isArray(result)).toBe(true)
  expect(result.length).toBeGreaterThan(0)
})

test('getExecutablePath returns platform-specific path', () => {
  const result = GetExecutablePath.getExecutablePath('ffmpeg')
  
  if (process.platform === 'linux') {
    expect(result[0]).toBe('ffmpeg-linux')
  } else if (process.platform === 'darwin') {
    expect(result[0]).toBe('ffmpeg-mac')
  } else if (process.platform === 'win32') {
    expect(result[0]).toBe('ffmpeg-win64.exe')
  }
})
