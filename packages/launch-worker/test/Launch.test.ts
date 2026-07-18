import { expect, test } from '@jest/globals'
import { getTrackingMode } from '../src/parts/Launch/Launch.ts'

test('getTrackingMode - tracked allocations measures use allocation tracking', () => {
  expect(getTrackingMode('tracked-allocations')).toBe('allocations')
  expect(getTrackingMode('trackedAllocations')).toBe('allocations')
  expect(getTrackingMode('tracked-allocations-from-start')).toBe('allocations')
  expect(getTrackingMode('trackedAllocationsFromStart')).toBe('allocations')
  expect(getTrackingMode('tracked-allocation-timeline')).toBe('allocations')
  expect(getTrackingMode('trackedAllocationTimeline')).toBe('allocations')
})

test('getTrackingMode - tracked timeout measures use timeout tracking', () => {
  expect(getTrackingMode('tracked-timeouts')).toBe('timeouts')
  expect(getTrackingMode('trackedTimeouts')).toBe('timeouts')
})

test('getTrackingMode - tracked everything uses everything tracking', () => {
  expect(getTrackingMode('tracked-everything')).toBe('everything')
  expect(getTrackingMode('trackedEverything')).toBe('everything')
})

test('getTrackingMode - other measures use function tracking', () => {
  expect(getTrackingMode('tracked-functions')).toBe('functions')
  expect(getTrackingMode('event-listener-count')).toBe('functions')
})
