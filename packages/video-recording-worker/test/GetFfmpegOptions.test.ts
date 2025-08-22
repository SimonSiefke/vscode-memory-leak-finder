import { expect, test } from '@jest/globals'
import * as GetFfmpegOptions from '../src/parts/GetFfmpegOptions/GetFfmpegOptions.ts'

test('getFfmpegOptions returns array of strings', () => {
  const result = GetFfmpegOptions.getFfmpegOptions(25, 1024, 768, '/tmp/test.webm')
  expect(Array.isArray(result)).toBe(true)
  expect(result.length).toBeGreaterThan(0)
  for (const arg of result) {
    expect(typeof arg).toBe('string')
  }
})

test('getFfmpegOptions includes fps in arguments', () => {
  const fps = 30
  const result = GetFfmpegOptions.getFfmpegOptions(fps, 1024, 768, '/tmp/test.webm')
  expect(result).toContain('30')
})

test('getFfmpegOptions includes output file in arguments', () => {
  const outFile = '/tmp/output.webm'
  const result = GetFfmpegOptions.getFfmpegOptions(25, 1024, 768, outFile)
  expect(result).toContain(outFile)
})

test('getFfmpegOptions includes video filter with dimensions', () => {
  const width = 1920
  const height = 1080
  const result = GetFfmpegOptions.getFfmpegOptions(25, width, height, '/tmp/test.webm')
  const filterArg = result.find((arg) => arg.includes('pad=') && arg.includes('crop='))
  expect(filterArg).toBeDefined()
  expect(filterArg).toContain(`pad=${width}:${height}`)
  expect(filterArg).toContain(`crop=${width}:${height}`)
})

test('getFfmpegOptions includes required codec arguments', () => {
  const result = GetFfmpegOptions.getFfmpegOptions(25, 1024, 768, '/tmp/test.webm')
  expect(result).toContain('-c:v')
  expect(result).toContain('vp8')
  expect(result).toContain('mjpeg')
})

test('getFfmpegOptions includes error loglevel', () => {
  const result = GetFfmpegOptions.getFfmpegOptions(25, 1024, 768, '/tmp/test.webm')
  expect(result).toContain('-loglevel')
  expect(result).toContain('error')
})
