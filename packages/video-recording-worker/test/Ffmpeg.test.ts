import { test, expect } from '@jest/globals'

test('Ffmpeg - should throw error for invalid outFile parameter', async () => {
  const { start } = await import('../src/parts/Ffmpeg/Ffmpeg.ts')

  await expect(start(123 as any)).rejects.toThrow()
  await expect(start(null as any)).rejects.toThrow()
  await expect(start(undefined as any)).rejects.toThrow()
})
