import { test, expect } from '@jest/globals'
import * as VideoPostProcessing from '../src/parts/VideoPostProcessing/VideoPostProcessing.ts'

test('createTestEvent creates correct event', () => {
  const event = VideoPostProcessing.createTestEvent('test-name', 'passed', 123.45)
  expect(event).toEqual({
    testName: 'test-name',
    status: 'passed',
    timestamp: 123.45,
  })
})

test('getTestStatusOverlayFilter creates correct filter for single event', () => {
  const testEvents = [
    { testName: 'test1', status: 'running' as const, timestamp: 0 },
    { testName: 'test1', status: 'passed' as const, timestamp: 5 },
  ]
  const filter = VideoPostProcessing.getTestStatusOverlayFilter(testEvents, 10)
  expect(filter).toContain("text='test1 ⏳'")
  expect(filter).toContain("text='test1 ✅'")
  expect(filter).toContain('between(t,0,5)')
  expect(filter).toContain('between(t,5,10)')
})
