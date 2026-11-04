import { beforeEach, expect, jest, test } from '@jest/globals'

const resolveTrackedLocationSourceMaps = jest.fn<(...args: unknown[]) => Promise<any>>()
jest.unstable_mockModule('../src/parts/ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts', () => ({
  resolveTrackedLocationSourceMaps,
}))
const { resolveStringsWithLocations } = await import('../src/parts/ResolveStringsWithLocations/ResolveStringsWithLocations.ts')

beforeEach(() => {
  resolveTrackedLocationSourceMaps.mockReset().mockResolvedValue({})
})
const scripts = { '7': { url: 'file:///bundle.js', sourceMapUrl: 'bundle.js.map' } }
const row = (string: string | null, count: number, sourceLocation: string | null = 'file:///bundle.js:2:5') => ({
  string,
  count,
  sourceLocation,
})

test('groups positive count growth by text and location, and sorts highest growth first', async () => {
  const before = [row('same', 2), row('decreased', 5), row('unchanged', 3)]
  const after = [
    row('same', 3),
    row('same', 3),
    row('largest', 10),
    row('decreased', 1),
    row('unchanged', 3),
    row('same', 2, 'other.js:1:1'),
  ]
  const result = await resolveStringsWithLocations(before, after, scripts, scripts)
  expect(
    result.map(({ string, location, count, beforeCount, afterCount }) => ({ string, location, count, beforeCount, afterCount })),
  ).toEqual([
    { string: 'largest', location: 'file:///bundle.js:2:5', count: 10, beforeCount: 0, afterCount: 10 },
    { string: 'same', location: 'file:///bundle.js:2:5', count: 4, beforeCount: 2, afterCount: 6 },
    { string: 'same', location: 'other.js:1:1', count: 2, beforeCount: 0, afterCount: 2 },
  ])
})

test('maps before grouping so different generated positions at one original location merge', async () => {
  const mapped = { originalSource: 'src/owner.ts', originalLine: 42, originalColumn: 6 }
  resolveTrackedLocationSourceMaps.mockResolvedValue({
    'file:///bundle.js:2:5': mapped,
    'file:///bundle.js:3:8': mapped,
    'file:///bundle.js:4:2': mapped,
  })
  const result = await resolveStringsWithLocations(
    [row('same', 3)],
    [row('same', 4, 'file:///bundle.js:3:8'), row('same', 5, 'file:///bundle.js:4:2')],
    scripts,
    scripts,
  )
  expect(result).toHaveLength(1)
  expect(result[0]).toMatchObject({
    string: 'same',
    location: 'src/owner.ts:42:7',
    originalLocation: 'src/owner.ts:42:7',
    count: 6,
    beforeCount: 3,
    afterCount: 9,
  })
  expect(resolveTrackedLocationSourceMaps).toHaveBeenLastCalledWith(['file:///bundle.js:3:8', 'file:///bundle.js:4:2'], scripts, false)
})

test('resolves each capture using its own script map', async () => {
  const afterScripts = { '8': { url: 'file:///bundle.js', sourceMapUrl: 'different.map' } }
  await resolveStringsWithLocations([row('same', 1)], [row('same', 2)], scripts, afterScripts)
  expect(resolveTrackedLocationSourceMaps).toHaveBeenNthCalledWith(1, ['file:///bundle.js:2:5'], scripts, false)
  expect(resolveTrackedLocationSourceMaps).toHaveBeenNthCalledWith(2, ['file:///bundle.js:2:5'], afterScripts, false)
})

test('retains generated locations when source maps fail or have incomplete positions', async () => {
  resolveTrackedLocationSourceMaps.mockRejectedValueOnce(new Error('missing map'))
  resolveTrackedLocationSourceMaps.mockResolvedValueOnce({
    'file:///bundle.js:2:5': { originalSource: 'src/file.ts', originalLine: null, originalColumn: null },
  })
  const result = await resolveStringsWithLocations([row('same', 1)], [row('same', 3)], scripts, scripts)
  expect(result[0]).toMatchObject({ location: 'file:///bundle.js:2:5', count: 2 })
  expect(result[0].originalLocation).toBeUndefined()
})

test('groups unknown locations without pretending to resolve them', async () => {
  const result = await resolveStringsWithLocations([], [row('same', 2, null), row('same', 3, null), row('different', 1, null)], {}, {})
  expect(result.map(({ string, location, count }) => ({ string, location, count }))).toEqual([
    { string: 'same', location: null, count: 5 },
    { string: 'different', location: null, count: 1 },
  ])
  expect(resolveTrackedLocationSourceMaps).not.toHaveBeenCalled()
})

test('does not source-map unknown script IDs using an unrelated workbench script', async () => {
  const result = await resolveStringsWithLocations([], [row('same', 1, '99:1:1')], {}, { '7': { url: 'workbench.desktop.main.js' } })
  expect(result[0].location).toBe('99:1:1')
  expect(resolveTrackedLocationSourceMaps).not.toHaveBeenCalled()
})

test('compares unavailable text by object identity rather than merging placeholder values', async () => {
  const first = { ...row(null, 1), heapObjectId: '11', stringType: 'sliced string' }
  const second = { ...first, heapObjectId: '13' }
  expect(await resolveStringsWithLocations([first], [first, second], {}, {})).toEqual([
    { ...second, location: second.sourceLocation, count: 1, beforeCount: 0, afterCount: 1 },
  ])
})

test('returns no leaks for unchanged or shrinking groups, with deterministic ties', async () => {
  expect(await resolveStringsWithLocations([row('same', 2)], [row('same', 2)], {}, {})).toEqual([])
  expect(await resolveStringsWithLocations([row('same', 2)], [row('same', 1)], {}, {})).toEqual([])
  const a = row('a', 1)
  const b = row('b', 1)
  expect(await resolveStringsWithLocations([], [a, b], {}, {})).toEqual(await resolveStringsWithLocations([], [b, a], {}, {}))
})
