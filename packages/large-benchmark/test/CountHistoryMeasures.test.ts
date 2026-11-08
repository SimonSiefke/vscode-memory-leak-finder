import { expect, jest, test } from '@jest/globals'
import {
  countHistoryMeasures,
  historyMeasures,
  historyMeasureDefinition,
  historyValue,
} from '../src/parts/CountHistoryMeasures/CountHistoryMeasures.ts'
import { countFrame } from '../src/parts/CountHistory/CountHistory.ts'
import { largePerformance } from '../src/parts/Main/Main.ts'

const requiredMeasures = [
  'function-count',
  'object-count',
  'string-object-count',
  'string-object-bytes',
  'array-count',
  'array-element-count',
  'weak-map-count',
] as const

test.each(requiredMeasures)('%s extracts the absolute after total using its own result key', (measure) => {
  const key = measure.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase())
  const data = { functionCount: { after: 999 }, eventListenerCount: { after: 888 }, [key]: { before: 100, after: 0 } }
  expect(historyValue(measure, data)).toBe(0)
  data[key]!.after = 123
  expect(historyValue(measure, data)).toBe(123)
})

test.each([undefined, null, '123', -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
  'missing and invalid totals never turn into zero (%s)',
  (after) => {
    expect(() => historyValue('string-object-bytes', { stringObjectBytes: { after } })).toThrow('Invalid absolute')
  },
)

test('structured ArrayBuffer totals select bytes, not object or backing-store counts', () => {
  expect(historyValue('array-buffer-bytes', { arrayBufferBytes: { after: { bytes: 1024, backingStoreCount: 3 } } })).toBe(1024)
  expect(() => historyValue('array-buffer-bytes', { arrayBufferBytes: { after: { backingStoreCount: 3 } } })).toThrow('Invalid absolute')
})

test('selection accepts comma-separated collectors and all, de-duplicates, and rejects nonnumeric diagnostics', async () => {
  expect(historyMeasures(' function-count,object-count,function-count ')).toEqual(['function-count', 'object-count'])
  expect(historyMeasures('all')).toEqual(Object.keys(countHistoryMeasures))
  expect(() => historyMeasures('object-count,event-listeners')).toThrow('History measure')
  expect(() => historyMeasures('object-count,')).toThrow('History measure')
  const fetch = jest.spyOn(globalThis, 'fetch')
  try {
    await expect(largePerformance(['history-matrix', '--measure', 'named-function-count3'])).rejects.toThrow('History measure')
    expect(fetch).not.toHaveBeenCalled()
  } finally {
    fetch.mockRestore()
  }
})

test('frames label counts, bytes, elements and entries distinctly', () => {
  for (const measure of ['function-count', 'string-object-bytes', 'array-element-count', 'map-size'] as const) {
    const definition = historyMeasureDefinition(measure)
    const frame = countFrame('1.50.0', [{ name: 'base.json', count: 100 }], 200, undefined, measure)
    expect(frame).toContain(`>${definition.title}</text>`)
    expect(frame).toContain(`>${definition.unit}</text>`)
  }
})

test('large byte totals use readable tick labels that fit the chart margin', () => {
  const frame = countFrame('1.50.0', [{ name: 'base.json', count: 100 * 1024 ** 2 }], 200 * 1024 ** 2, undefined, 'string-object-bytes')
  expect(frame).toContain('209.7M')
  expect(frame).not.toContain('209,715,200')
})
