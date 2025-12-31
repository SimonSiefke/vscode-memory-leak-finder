import { expect, test } from '@jest/globals'
import * as GetExecutablePath from '../src/parts/GetExecutablePath/GetExecutablePath.ts'

test('getExecutablePath returns path for ffmpeg', () => {
  const platform = process.platform
  const result = GetExecutablePath.getExecutablePath(platform, 'ffmpeg')
  expect(Array.isArray(result)).toBe(true)
  expect(result.length).toBeGreaterThan(0)
})

test('getExecutablePath returns platform-specific path', () => {
  const platform = process.platform
  const result = GetExecutablePath.getExecutablePath(platform, 'ffmpeg')

  switch (platform) {
    case 'darwin': {
      expect(result[0]).toBe('ffmpeg-mac')

      break
    }
    case 'linux': {
      expect(result[0]).toBe('ffmpeg-linux')

      break
    }
    case 'win32': {
      expect(result[0]).toBe('ffmpeg-win64.exe')

      break
    }
    // No default
  }
})
