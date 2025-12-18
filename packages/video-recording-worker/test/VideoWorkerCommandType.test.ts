import { expect, test } from '@jest/globals'
import * as VideoWorkerCommandType from '../src/parts/VideoWorkerCommandType/VideoWorkerCommandType.ts'

test('VideoRecordingStart', () => {
  expect(VideoWorkerCommandType.VideoRecordingStart).toBe('VideoRecording.start')
})

test('VideoRecordingAddChapter', () => {
  expect(VideoWorkerCommandType.VideoRecordingAddChapter).toBe('VideoRecording.addChapter')
})

test('VideoRecordingFinalize', () => {
  expect(VideoWorkerCommandType.VideoRecordingFinalize).toBe('VideoRecording.finalize')
})

test('ConnectDevtools', () => {
  expect(VideoWorkerCommandType.ConnectDevtools).toBe('ConnectDevtools.connectDevtools')
})
