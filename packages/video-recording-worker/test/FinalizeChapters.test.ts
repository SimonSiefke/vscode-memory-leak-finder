import { test, expect } from '@jest/globals'
import * as FinalizeChapters from '../src/parts/FinalizeChapters/FinalizeChapters.ts'
import * as FfmpegProcessState from '../src/parts/FfmpegProcessState/FfmpegProcessState.ts'
import * as VideoChapter from '../src/parts/VideoChapter/VideoChapter.ts'
import { existsSync } from 'fs'

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}))

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
}))

jest.mock('../src/parts/Exec/Exec.ts', () => ({
  exec: jest.fn(),
}))

jest.mock('../src/parts/FfmpegProcessState/FfmpegProcessState.ts', () => ({
  getOutFile: jest.fn(),
}))

jest.mock('../src/parts/VideoChapter/VideoChapter.ts', () => ({
  state: {
    chapters: [],
  },
}))

const { readFile, writeFile } = require('fs/promises')
const { exec } = require('../src/parts/Exec/Exec.ts')

test('FinalizeChapters - should return early if native ffmpeg not available', async () => {
  ;(existsSync as jest.Mock).mockReturnValue(false)

  await FinalizeChapters.finalizeChapters()

  expect(exec).not.toHaveBeenCalled()
})

test('FinalizeChapters - should process chapters when ffmpeg is available', async () => {
  ;(existsSync as jest.Mock).mockReturnValue(true)
  ;(FfmpegProcessState.getOutFile as jest.Mock).mockReturnValue('/test/output.webm')
  ;(readFile as jest.Mock).mockResolvedValue(';FFMETADATA1\n')
  ;(exec as jest.Mock).mockResolvedValue({})
  ;(VideoChapter.state.chapters as any) = [
    { name: 'Chapter 1', time: 5000 },
    { name: 'Chapter 2', time: 10000 },
  ]

  await FinalizeChapters.finalizeChapters()

  expect(exec).toHaveBeenCalledTimes(2)
  expect(exec).toHaveBeenCalledWith('ffmpeg', ['-i', 'output.webm', '-y', 'meta.ffmeta'], {
    cwd: '/test',
  })
  expect(writeFile).toHaveBeenCalled()
  expect(exec).toHaveBeenCalledWith(
    'ffmpeg',
    ['-i', 'output.webm', '-i', 'metadata.txt', '-map_metadata', '1', '-codec', 'copy', '-y', 'out.webm'],
    {
      cwd: '/test',
    },
  )
})

test('FinalizeChapters - should handle empty chapters', async () => {
  ;(existsSync as jest.Mock).mockReturnValue(true)
  ;(FfmpegProcessState.getOutFile as jest.Mock).mockReturnValue('/test/output.webm')
  ;(readFile as jest.Mock).mockResolvedValue(';FFMETADATA1\n')
  ;(exec as jest.Mock).mockResolvedValue({})
  ;(VideoChapter.state.chapters as any) = []

  await FinalizeChapters.finalizeChapters()

  expect(exec).toHaveBeenCalledTimes(2)
  expect(writeFile).toHaveBeenCalledWith('/test/metadata.txt', ';FFMETADATA1\n\n')
})
