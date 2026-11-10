import { beforeEach, expect, jest, test } from '@jest/globals'

const invoke = jest.fn<(...args: unknown[]) => Promise<void>>()
const dispose = jest.fn<() => Promise<void>>()

jest.unstable_mockModule('../src/parts/LaunchNetworkWorker/LaunchNetworkWorker.ts', () => ({
  launchNetworkWorker: async () => ({ invoke, [Symbol.asyncDispose]: dispose }),
}))

const { download } = await import('../src/parts/Download/Download.ts')

beforeEach(() => {
  jest.resetAllMocks()
  invoke.mockResolvedValue()
  dispose.mockResolvedValue()
})

test('download stops after the first successful mirror', async () => {
  await download('ffmpeg', ['https://primary/ffmpeg.zip', 'https://backup/ffmpeg.zip'], '/tmp/ffmpeg.zip')
  expect(invoke).toHaveBeenCalledTimes(1)
  expect(invoke).toHaveBeenCalledWith('Network.download', 'ffmpeg', 'https://primary/ffmpeg.zip', '/tmp/ffmpeg.zip')
  expect(dispose).toHaveBeenCalledTimes(1)
})

test('download tries the next mirror after a connection timeout', async () => {
  invoke.mockRejectedValueOnce(Object.assign(new Error('connection timed out'), { code: 'ETIMEDOUT' }))
  await download('ffmpeg', ['https://primary/ffmpeg.zip', 'https://backup/ffmpeg.zip'], '/tmp/ffmpeg.zip')
  expect(invoke).toHaveBeenCalledTimes(2)
  expect(invoke).toHaveBeenNthCalledWith(2, 'Network.download', 'ffmpeg', 'https://backup/ffmpeg.zip', '/tmp/ffmpeg.zip')
  expect(dispose).toHaveBeenCalledTimes(1)
})

test('download rejects and disposes the worker when every mirror fails', async () => {
  const lastError = new Error('backup unavailable')
  invoke.mockRejectedValueOnce(new Error('primary unavailable')).mockRejectedValueOnce(lastError)
  await expect(download('ffmpeg', ['https://primary/ffmpeg.zip', 'https://backup/ffmpeg.zip'], '/tmp/ffmpeg.zip')).rejects.toBe(lastError)
  expect(invoke).toHaveBeenCalledTimes(2)
  expect(dispose).toHaveBeenCalledTimes(1)
})
