import { expect, test } from '@jest/globals'
import * as FfmpegProcessState from '../src/parts/FfmpegProcessState/FfmpegProcessState.ts'

test('initial state has undefined process', () => {
  expect(FfmpegProcessState.get()).toBeUndefined()
})

test('initial state has empty outFile', () => {
  expect(FfmpegProcessState.getOutFile()).toBe('')
})

test('set and get process', () => {
  const mockProcess = {} as any
  FfmpegProcessState.set(mockProcess)
  expect(FfmpegProcessState.get()).toBe(mockProcess)
})

test('setOutFile and getOutFile', () => {
  const testFile = '/tmp/test-video.webm'
  FfmpegProcessState.setOutFile(testFile)
  expect(FfmpegProcessState.getOutFile()).toBe(testFile)
})

test('set process to undefined', () => {
  FfmpegProcessState.set(undefined)
  expect(FfmpegProcessState.get()).toBeUndefined()
})
