import { expect, test } from '@jest/globals'
import * as VideoRecording from '../src/parts/VideoRecording/VideoRecording.ts'

test('start function exists', () => {
  expect(typeof VideoRecording.start).toBe('function')
})
