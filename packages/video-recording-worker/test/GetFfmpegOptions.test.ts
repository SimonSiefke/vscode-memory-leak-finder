import { expect, test } from '@jest/globals'
import * as GetFfmpegOptions from '../src/parts/GetFfmpegOptions/GetFfmpegOptions.ts'

test('getFfmpegOptions returns array of strings', () => {
  const result = GetFfmpegOptions.getFfmpegOptions(25, '/tmp/test.webm')
  expect(Array.isArray(result)).toBe(true)
  expect(result.length).toBeGreaterThan(0)
  for (const arg of result) {
    expect(typeof arg).toBe('string')
  }
})

test('getFfmpegOptions includes fps in arguments', () => {
  const fps = 30
  const result = GetFfmpegOptions.getFfmpegOptions(fps, '/tmp/test.webm')
  expect(result).toContain('30')
})

test('getFfmpegOptions includes output file in arguments', () => {
  const outFile = '/tmp/output.webm'
  const result = GetFfmpegOptions.getFfmpegOptions(25, outFile)
  expect(result).toContain(outFile)
})

test('getFfmpegOptions preserves the dimensions provided by Chrome', () => {
  const result = GetFfmpegOptions.getFfmpegOptions(25, '/tmp/test.webm')
  expect(result).not.toContain('-vf')
})

test('getFfmpegOptions includes required codec arguments', () => {
  const result = GetFfmpegOptions.getFfmpegOptions(25, '/tmp/test.webm')
  expect(result).toContain('-c:v')
  expect(result).toContain('vp8')
  expect(result).toContain('mjpeg')
})

test('getFfmpegOptions includes error loglevel', () => {
  const result = GetFfmpegOptions.getFfmpegOptions(25, '/tmp/test.webm')
  expect(result).toContain('-loglevel')
  expect(result).toContain('error')
})
