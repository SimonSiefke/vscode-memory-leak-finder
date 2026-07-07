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

test('getTrackingMode - other measures use function tracking', () => {
  expect(getTrackingMode('tracked-functions')).toBe('functions')
  expect(getTrackingMode('event-listener-count')).toBe('functions')
})
