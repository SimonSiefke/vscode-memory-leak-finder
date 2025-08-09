import { expect, test } from '@jest/globals'
import * as VideosPath from '../src/parts/VideosPath/VideosPath.ts'

test('videosPath is a string', () => {
  expect(typeof VideosPath.videosPath).toBe('string')
  expect(VideosPath.videosPath.length).toBeGreaterThan(0)
})

test('videosPath contains .vscode-videos', () => {
  expect(VideosPath.videosPath.includes('.vscode-videos')).toBe(true)
})

test('videosPath is absolute', () => {
  expect(VideosPath.videosPath.startsWith('/')).toBe(true)
})
