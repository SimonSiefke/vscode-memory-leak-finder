import { test, expect, jest } from '@jest/globals'

test('Ffmpeg - should throw error for invalid outFile parameter', async () => {
  const { start } = await import('../src/parts/Ffmpeg/Ffmpeg.ts')

  await expect(start(123 as any)).rejects.toThrow()
  await expect(start(null as any)).rejects.toThrow()
  await expect(start(undefined as any)).rejects.toThrow()
})

test('Ffmpeg - should throw error if ffmpeg binary not found', async () => {
  jest.unstable_mockModule('fs', () => ({
    existsSync: jest.fn(() => false),
  }))

  jest.unstable_mockModule('../src/parts/GetFfmpegPath/GetFfmpegPath.ts', () => ({
    getFfmpegPath: jest.fn(() => '/usr/bin/ffmpeg'),
  }))

  const { start } = await import('../src/parts/Ffmpeg/Ffmpeg.ts')

  await expect(start('/test/output.webm')).rejects.toThrow('ffmpeg binary not found at /usr/bin/ffmpeg')
})
