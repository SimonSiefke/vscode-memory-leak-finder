import { expect, test } from '@jest/globals'
import * as HandleFrame from '../src/parts/HandleFrame/HandleFrame.ts'
import * as FfmpegProcessState from '../src/parts/FfmpegProcessState/FfmpegProcessState.ts'

test('handleFrame function exists', () => {
  expect(typeof HandleFrame.handleFrame).toBe('function')
})

test('handleFrame should return early when no ffmpeg process exists', async () => {
  FfmpegProcessState.set(undefined)

  const message = {
    params: { data: 'testdata', sessionId: 'test' },
    sessionId: 'test',
  }

  await expect(HandleFrame.handleFrame(message)).resolves.toBeUndefined()
})

test('handleFrame should return early when ffmpeg process has no stdin', async () => {
  const mockProcess = { stdin: null }
  FfmpegProcessState.set(mockProcess)

  const message = {
    params: { data: 'testdata', sessionId: 'test' },
    sessionId: 'test',
  }

  await expect(HandleFrame.handleFrame(message)).resolves.toBeUndefined()
})
