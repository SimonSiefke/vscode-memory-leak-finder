import { expect, test } from '@jest/globals'
import * as VideoRecording from '../src/parts/VideoRecording/VideoRecording.ts'

test('start function exists', () => {
  expect(typeof VideoRecording.start).toBe('function')
})

test('start should throw when called with non-string argument', async () => {
  await expect(VideoRecording.start(123)).rejects.toThrow()
  await expect(VideoRecording.start(null)).rejects.toThrow()
  await expect(VideoRecording.start(undefined)).rejects.toThrow()
})
