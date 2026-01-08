import { expect, test } from '@jest/globals'
import * as GetFfmpegPath from '../src/parts/GetFfmpegPath/GetFfmpegPath.ts'

test('getFfmpegPath returns a string', () => {
  const platform = 'linux'
  const result = GetFfmpegPath.getFfmpegPath(platform)
  expect(typeof result).toBe('string')
  expect(result.length).toBeGreaterThan(0)
})

test('getFfmpegPath contains ffmpeg in path', () => {
  const platform = 'linux'
  const result = GetFfmpegPath.getFfmpegPath(platform)
  expect(result.includes('ffmpeg')).toBe(true)
})

test('getFfmpegPath contains .vscode-ffmpeg', () => {
  const platform = 'linux'
  const result = GetFfmpegPath.getFfmpegPath(platform)
  expect(result.includes('.vscode-ffmpeg')).toBe(true)
})
