import { test, expect } from '@jest/globals'
import * as Ffmpeg from '../src/parts/Ffmpeg/Ffmpeg.ts'
import { existsSync } from 'fs'
import { spawn } from 'child_process'
import { EventEmitter } from 'events'

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}))

jest.mock('child_process', () => ({
  spawn: jest.fn(),
}))

jest.mock('../src/parts/GetFfmpegPath/GetFfmpegPath.ts', () => ({
  getFfmpegPath: jest.fn(),
}))

jest.mock('../src/parts/GetFfmpegOptions/GetFfmpegOptions.ts', () => ({
  getFfmpegOptions: jest.fn(),
}))

jest.mock('../src/parts/FfmpegProcessState/FfmpegProcessState.ts', () => ({
  set: jest.fn(),
}))

const { getFfmpegPath } = require('../src/parts/GetFfmpegPath/GetFfmpegPath.ts')
const { getFfmpegOptions } = require('../src/parts/GetFfmpegOptions/GetFfmpegOptions.ts')
const { set: setFfmpegProcessState } = require('../src/parts/FfmpegProcessState/FfmpegProcessState.ts')

class MockChildProcess extends EventEmitter {
  stdout = new EventEmitter()
  stderr = new EventEmitter()
  stdin = new EventEmitter()
}

test('Ffmpeg - should throw error if ffmpeg binary not found', async () => {
  ;(getFfmpegPath as jest.Mock).mockReturnValue('/usr/bin/ffmpeg')
  ;(existsSync as jest.Mock).mockReturnValue(false)

  await expect(Ffmpeg.start('/test/output.webm')).rejects.toThrow('ffmpeg binary not found at /usr/bin/ffmpeg')
})

test('Ffmpeg - should throw error for invalid outFile parameter', async () => {
  await expect(Ffmpeg.start(123 as any)).rejects.toThrow()
  await expect(Ffmpeg.start(null as any)).rejects.toThrow()
  await expect(Ffmpeg.start(undefined as any)).rejects.toThrow()
})

test('Ffmpeg - should start ffmpeg process successfully', async () => {
  const mockChildProcess = new MockChildProcess()
  const outFile = '/test/output.webm'
  const ffmpegPath = '/usr/bin/ffmpeg'
  const options = ['-f', 'rawvideo', '-pixel_format', 'bgra', '-video_size', '1024x768', '-framerate', '25', '-i', 'pipe:0', '-c:v', 'libvpx-vp9', '-y', outFile]

  ;(getFfmpegPath as jest.Mock).mockReturnValue(ffmpegPath)
  ;(existsSync as jest.Mock).mockReturnValue(true)
  ;(getFfmpegOptions as jest.Mock).mockReturnValue(options)
  ;(spawn as jest.Mock).mockReturnValue(mockChildProcess)

  // Capture console.log calls
  const logSpy = jest.spyOn(console, 'log').mockImplementation()

  await Ffmpeg.start(outFile)

  expect(getFfmpegPath).toHaveBeenCalled()
  expect(existsSync).toHaveBeenCalledWith(ffmpegPath)
  expect(getFfmpegOptions).toHaveBeenCalledWith(25, 1024, 768, outFile)
  expect(spawn).toHaveBeenCalledWith(ffmpegPath, options, {
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  expect(setFfmpegProcessState).toHaveBeenCalledWith(mockChildProcess)

  // Test event handlers
  mockChildProcess.stdout.emit('data', Buffer.from('test stdout'))
  mockChildProcess.stderr.emit('data', Buffer.from('test stderr'))
  mockChildProcess.stdin.emit('finish')
  mockChildProcess.stdin.emit('error')
  mockChildProcess.emit('exit')

  expect(logSpy).toHaveBeenCalledWith({ x: 'test stdout' })
  expect(logSpy).toHaveBeenCalledWith({ x: 'test stderr' })
  expect(logSpy).toHaveBeenCalledWith('ffmpeg finished')
  expect(logSpy).toHaveBeenCalledWith('ffmpeg error')
  expect(logSpy).toHaveBeenCalledWith('ffmpeg exit')

  logSpy.mockRestore()
})
