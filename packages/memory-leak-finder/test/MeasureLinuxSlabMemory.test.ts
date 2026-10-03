import { expect, test } from '@jest/globals'
import * as Measure from '../src/parts/MeasureLinuxSlabMemory/MeasureLinuxSlabMemory.ts'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as Measures from '../src/parts/Measures/Measures.ts'

const snapshot = (rows: string) => ({
  capturedAt: '',
  raw: rows,
  rows: Measure.parseSlabinfo(`slabinfo - version: 2.1\n# name active total size\n${rows}`),
})
test('resolves public measure name', () => {
  expect(GetMeasure.getMeasure({ Measures }, 'linux-slab-memory')).toBe(Measure)
})
test('distinguishes active bytes from reserved object capacity', () => {
  expect(snapshot('kmalloc-64 2 100 64 64 1 : tunables 0 0 0 : slabdata 2 2 0').rows[0]).toMatchObject({
    activeBytes: 128,
    capacityBytes: 6400,
  })
})
test('compares new, removed and growing caches without masking growth', () => {
  const result = Measure.compare(
    snapshot('gone 100 100 1024 4 1\ngrowing 1 1 1024 4 1'),
    snapshot('new 1 1 64 64 1\ngrowing 100 100 1024 4 1'),
  )
  expect(result.rows.map((row) => [row.name, row.deltaActiveBytes])).toEqual([
    ['growing', 101376],
    ['new', 64],
    ['gone', -102400],
  ])
  expect(Measure.isLeak(result)).toBe(true)
})
test('unchanged and shrinking caches are not suspected leaks', () => {
  const before = snapshot('cache 100 100 1024 4 1')
  expect(Measure.isLeak(Measure.compare(before, before))).toBe(false)
  expect(Measure.isLeak(Measure.compare(before, snapshot('cache 1 100 1024 4 1')))).toBe(false)
})
test.each(['', 'slabinfo - version: 1.0', 'slabinfo - version: 2.1\nbad a 1 1 1 1', 'slabinfo - version: 2.1\nbad 2 1 64 1 1'])(
  'rejects unavailable or malformed input: %s',
  (raw) => {
    expect(() => Measure.parseSlabinfo(raw)).toThrow()
  },
)
