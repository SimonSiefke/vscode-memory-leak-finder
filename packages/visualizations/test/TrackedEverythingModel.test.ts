import { expect, test } from '@jest/globals'
import {
  decodeTrackedEverythingEvents,
  eventIndexToTime,
  getSitePath,
  isTrackedEverythingDataset,
  timeToEventIndex,
} from '../src/trackedEverythingModel.ts'
import type { TrackedEverythingDataset } from '../src/trackedEverythingTypes.ts'

const dataset: TrackedEverythingDataset = {
  durationMs: 100,
  eventCount: 4,
  eventFile: 'events.bin',
  kind: 'tracked-everything',
  scenario: 'startup',
  schemaVersion: 1,
  sites: [
    {
      id: 0,
      location: '/out/workbench.js:1:2',
      originalColumn: 4,
      originalLine: 3,
      originalLocation: 'src/workbench.ts:3:4',
      originalSource: 'src/workbench.ts',
      type: 'Object',
    },
    {
      id: 1,
      location: '/out/editor.js:5:6',
      originalColumn: null,
      originalLine: null,
      originalLocation: null,
      originalSource: null,
      type: 'String',
    },
  ],
  timeMarks: [
    { elapsedMs: 0, eventIndex: 0 },
    { elapsedMs: 40, eventIndex: 2 },
    { elapsedMs: 100, eventIndex: 4 },
  ],
}

test('validates the tracked-everything dataset contract', () => {
  expect(isTrackedEverythingDataset(dataset)).toBe(true)
  expect(isTrackedEverythingDataset({ ...dataset, kind: 'other' })).toBe(false)
  expect(isTrackedEverythingDataset({ ...dataset, eventCount: 1.5 })).toBe(false)
})

test('validates and decodes the little event stream', () => {
  const events = new Uint32Array([0, 1, 1, 0])
  expect([...decodeTrackedEverythingEvents(events.buffer, dataset)]).toEqual([0, 1, 1, 0])
  expect(() => decodeTrackedEverythingEvents(new Uint32Array([0, 2, 1, 0]).buffer, dataset)).toThrow('Invalid tracked-everything site id 2')
  expect(() => decodeTrackedEverythingEvents(new Uint32Array([0]).buffer, dataset)).toThrow('Invalid event stream length')
})

test('maps between sparse elapsed-time checkpoints and exact allocation indexes', () => {
  expect(timeToEventIndex(dataset.timeMarks, 0, 4)).toBe(0)
  expect(timeToEventIndex(dataset.timeMarks, 20, 4)).toBe(1)
  expect(timeToEventIndex(dataset.timeMarks, 70, 4)).toBe(3)
  expect(timeToEventIndex(dataset.timeMarks, 100, 4)).toBe(4)
  expect(eventIndexToTime(dataset.timeMarks, 1, 100)).toBe(20)
  expect(eventIndexToTime(dataset.timeMarks, 3, 100)).toBe(70)
})

test('prefers original source paths and falls back to generated paths', () => {
  expect(getSitePath(dataset.sites[0])).toBe('src/workbench.ts')
  expect(getSitePath(dataset.sites[1])).toBe('/out/editor.js')
})

test('decodes a synthetic 400,000-event capture without losing order', () => {
  const largeDataset = { ...dataset, eventCount: 400_000 }
  const source = new Uint32Array(largeDataset.eventCount)
  for (let index = 0; index < source.length; index++) {
    source[index] = index % 2
  }
  const decoded = decodeTrackedEverythingEvents(source.buffer, largeDataset)
  expect(decoded).toHaveLength(400_000)
  expect(decoded[0]).toBe(0)
  expect(decoded[399_999]).toBe(1)
})
