import { test, expect, jest } from '@jest/globals'

test('FinalizeChapters - should return early if native ffmpeg not available', async () => {
  jest.unstable_mockModule('fs', () => ({
    existsSync: jest.fn(() => false),
  }))

  const { finalizeChapters } = await import('../src/parts/FinalizeChapters/FinalizeChapters.ts')

  // Should return early without throwing
  await expect(finalizeChapters()).resolves.toBeUndefined()
})

test('FinalizeChapters - should handle case when ffmpeg is available', async () => {
  jest.unstable_mockModule('fs', () => ({
    existsSync: jest.fn(() => true),
  }))

  jest.unstable_mockModule('fs/promises', () => ({
    readFile: jest.fn(() => Promise.resolve(';FFMETADATA1\n')),
    writeFile: jest.fn(() => Promise.resolve()),
  }))

  jest.unstable_mockModule('../src/parts/Exec/Exec.ts', () => ({
    exec: jest.fn(() => Promise.resolve({})),
  }))

  jest.unstable_mockModule('../src/parts/FfmpegProcessState/FfmpegProcessState.ts', () => ({
    getOutFile: jest.fn(() => '/test/output.webm'),
  }))

  jest.unstable_mockModule('../src/parts/VideoChapter/VideoChapter.ts', () => ({
    state: {
      chapters: [
        { name: 'Chapter 1', time: 5000 },
      ],
    },
  }))

  const { finalizeChapters } = await import('../src/parts/FinalizeChapters/FinalizeChapters.ts')

  // Should complete without throwing
  await expect(finalizeChapters()).resolves.toBeUndefined()
})
