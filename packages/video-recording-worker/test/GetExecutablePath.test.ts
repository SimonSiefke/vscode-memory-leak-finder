import { expect, test } from '@jest/globals'
import * as GetExecutablePath from '../src/parts/GetExecutablePath/GetExecutablePath.ts'

test('getExecutablePath returns path for ffmpeg', () => {
  const result = GetExecutablePath.getExecutablePath('ffmpeg')
  expect(Array.isArray(result)).toBe(true)
  expect(result.length).toBeGreaterThan(0)
})

test('getExecutablePath returns platform-specific path', () => {
  const result = GetExecutablePath.getExecutablePath('ffmpeg')

  switch (process.platform) {
    case 'linux': {
      expect(result[0]).toBe('ffmpeg-linux')

      break
    }
    case 'darwin': {
      expect(result[0]).toBe('ffmpeg-mac')

      break
    }
    case 'win32': {
      expect(result[0]).toBe('ffmpeg-win64.exe')

      break
    }
    // No default
  }
})
