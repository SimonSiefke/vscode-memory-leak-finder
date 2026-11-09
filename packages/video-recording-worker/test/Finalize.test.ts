import { beforeEach, expect, jest, test } from '@jest/globals'
import { EventEmitter } from 'node:events'

const processState = { current: undefined as any }
const finalizeChapters = jest.fn(async () => {})
const compressVideo = jest.fn(async () => {})
jest.unstable_mockModule('../src/parts/FfmpegProcessState/FfmpegProcessState.ts', () => ({
  get: () => processState.current,
  getCompressVideo: () => true,
}))
jest.unstable_mockModule('../src/parts/FinalizeChapters/FinalizeChapters.ts', () => ({ finalizeChapters }))
jest.unstable_mockModule('../src/parts/CompressVideo/CompressVideo.ts', () => ({ compressVideo }))
const { finalize } = await import('../src/parts/Finalize/Finalize.ts')
beforeEach(() => {
  jest.clearAllMocks()
  processState.current = undefined
})

test('finalize returns when no encoder was started', async () => {
  await expect(finalize()).resolves.toBeUndefined()
  expect(finalizeChapters).not.toHaveBeenCalled()
})

test('finalize waits for the encoder to close before processing its output', async () => {
  const encoder = Object.assign(new EventEmitter(), { exitCode: null, signalCode: null, stdin: { end: jest.fn() } })
  processState.current = encoder
  const finalizing = finalize()
  expect(encoder.stdin.end).toHaveBeenCalledTimes(1)
  expect(finalizeChapters).not.toHaveBeenCalled()
  encoder.emit('close', 0, null)
  await finalizing
  expect(finalizeChapters).toHaveBeenCalledTimes(1)
  expect(compressVideo).toHaveBeenCalledTimes(1)
})

test('an encoder that already closed does not wait for another close event', async () => {
  const encoder = { exitCode: 0, signalCode: null, stdin: { end: jest.fn() } }
  processState.current = encoder
  await finalize()
  expect(encoder.stdin.end).not.toHaveBeenCalled()
  expect(finalizeChapters).toHaveBeenCalledTimes(1)
})
