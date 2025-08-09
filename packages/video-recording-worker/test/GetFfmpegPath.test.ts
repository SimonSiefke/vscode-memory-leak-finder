import { expect, test } from '@jest/globals'
import * as GetFfmpegPath from '../src/parts/GetFfmpegPath/GetFfmpegPath.ts'

test('getFfmpegPath returns a string', () => {
  const result = GetFfmpegPath.getFfmpegPath()
  expect(typeof result).toBe('string')
  expect(result.length).toBeGreaterThan(0)
})

test('getFfmpegPath contains ffmpeg in path', () => {
  const result = GetFfmpegPath.getFfmpegPath()
  expect(result.includes('ffmpeg')).toBe(true)
})

test('getFfmpegPath contains .vscode-ffmpeg', () => {
  const result = GetFfmpegPath.getFfmpegPath()
  expect(result.includes('.vscode-ffmpeg')).toBe(true)
})
