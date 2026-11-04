import { expect, test } from '@jest/globals'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as Chart from '../src/parts/CreateStringsWithLocationsChart/CreateStringsWithLocationsChart.ts'
import * as Charts from '../src/parts/Charts/Charts.ts'

test('registers the strings-with-locations chart', () => {
  expect(Charts.StringsWithLocations).toBe(Chart)
  expect(Chart.name).toBe('strings-with-locations')
  expect(Chart.multiple).toBe(true)
  expect(Chart.createChart()).toMatchObject({ type: 'dual-bar-chart', rowHeight: 20, yLabel: 'Added String Objects by Retaining Location' })
})

test('shows added counts in descending order with stable text/location identities', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'strings-with-locations-chart-'))
  try {
    expect(await Chart.getData(directory)).toEqual([])
    const results = join(directory, 'strings-with-locations')
    await mkdir(results)
    await writeFile(
      join(results, 'output.json'),
      JSON.stringify({
        stringsWithLocations: [
          { string: 'terminal output', location: 'src/owner.ts:42:7', count: 2 },
          { string: 'terminal output', location: 'src/other.ts:5:1', count: 10 },
          { string: null, location: null, count: 1, stringType: 'sliced string', heapObjectId: '11' },
          { string: 'x'.repeat(150), location: null, count: 1 },
        ],
      }),
    )
    const result = await Chart.getData(directory)
    expect(result[0].filename).toBe('output')
    expect(result[0].data.map((item) => item.count)).toEqual([10, 2, 1, 1])
    expect(result[0].data[0]).toMatchObject({
      name: '"terminal output" (src/other.ts:5:1)',
      label: '"terminal output" at src/other.ts:5:1',
      delta: 10,
    })
    expect(result[0].data.every((item) => !item.label.includes('\n'))).toBe(true)
    expect(new Set(result[0].data.map((item) => item.comparisonKey)).size).toBe(4)
    expect(result[0].data.some((item) => item.name.includes('[sliced string #11] (unknown location)'))).toBe(true)
    expect(result[0].data.some((item) => item.name.includes('x'.repeat(150)))).toBe(true)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('groups numeric path IDs at the same location and preserves total growth and original values', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'strings-with-locations-grouping-'))
  try {
    await mkdir(join(directory, 'strings-with-locations'))
    await writeFile(
      join(directory, 'strings-with-locations', 'output.json'),
      JSON.stringify({
        stringsWithLocations: [
          { string: '/<terminal-window>/25', location: 'src/uri.ts:455:1', count: 2 },
          { string: '/<terminal-window>/26', location: 'src/uri.ts:455:1', count: 3 },
          { string: '/<terminal-window>/26', location: 'src/uri.ts:456:1', count: 1 },
          { string: '/<terminal-window>/26', location: 'src/uri.ts:455:1', locationKind: 'stack-frame', count: 1 },
        ],
      }),
    )
    const [{ data }] = await Chart.getData(directory)
    expect(data).toHaveLength(3)
    expect(data.map((item) => item.count)).toEqual([5, 1, 1])
    expect(data[0].name).toBe(`${JSON.stringify('/<terminal-window>/\\d+')} (src/uri.ts:455:1)`)
    expect(data[0].title).toContain('/<terminal-window>/25')
    expect(data[0].title).toContain('/<terminal-window>/26')
    expect(data.some((item) => item.label.includes('stack frame: '))).toBe(true)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('collapses stack components using measured partitions and preserves every added object', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'strings-with-locations-stacks-'))
  const first = 'Error\n    at first (file:///owner.js:20:5)'
  const second = 'Error\n    at second (file:///owner.js:20:5)'
  const location = 'src/owner.ts:20:5'
  try {
    await mkdir(join(directory, 'strings-with-locations'))
    await writeFile(
      join(directory, 'strings-with-locations', 'output.json'),
      JSON.stringify({
        stringsWithLocations: [
          { string: first, location, count: 2, stackCounts: [{ stack: first, count: 2 }] },
          { string: second, location, count: 3, stackCounts: [{ stack: second, count: 3 }] },
          {
            string: 'common fragment',
            location,
            count: 6,
            stackCounts: [
              { stack: first, count: 2 },
              { stack: second, count: 3 },
            ],
          },
          { string: null, stringType: 'sliced string', heapObjectId: '11', location, count: 1, stackCounts: [{ stack: first, count: 1 }] },
          { string: 'unrelated', location, count: 1 },
        ],
      }),
    )
    const [{ data }] = await Chart.getData(directory)
    expect(data).toHaveLength(4)
    expect(data.map((item) => item.count)).toEqual([6, 5, 1, 1])
    expect(data.reduce((total, item) => total + item.count, 0)).toBe(13)
    const firstRow = data.find((item) => item.title.includes(first))!
    expect(firstRow.name.startsWith('Stack: ')).toBe(true)
    expect(firstRow.title).toContain('2 complete stack string objects; 3 component string objects')
    expect(data.filter((item) => item.name.startsWith('Stack: '))).toHaveLength(2)
    expect(data.every((item) => !item.label.includes('\n') && item.label.includes(' at '))).toBe(true)
    expect(new Set(data.filter((item) => item.name.startsWith('Stack: ')).map((item) => item.label)).size).toBe(2)
    expect(data.some((item) => item.name.startsWith('"common fragment"'))).toBe(true)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('combines short event hashes at one location while preserving counts, samples, and stack ownership', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'strings-with-locations-hashes-'))
  const location = 'src/vs/base/common/event.ts:1208:14'
  const stack = 'Error\n    at owner (file:///owner.js:1:1)'
  try {
    await mkdir(join(directory, 'strings-with-locations'))
    await writeFile(
      join(directory, 'strings-with-locations', 'output.json'),
      JSON.stringify({
        stringsWithLocations: [
          { string: 'a2df', location, count: 2 },
          { string: 'a2e0', location, count: 3 },
          { string: 'Ab12Z9', location, count: 4 },
          { string: 'event', location, count: 5 },
          { string: 'a2df', location: 'src/vs/base/common/event.ts:1209:14', count: 1 },
          { string: 'a2e0', location, locationKind: 'stack-frame', count: 1 },
          { string: 'a2df', location: null, count: 1 },
          { string: 'a2e0', location: null, count: 1 },
          { string: '1234', location, count: 1 },
          { string: 'a2f', location, count: 1 },
          { string: 'a2e1234', location, count: 1 },
          { string: 'a_2e', location, count: 1 },
          { string: '<short hash>', location, count: 1 },
          { string: 'a2df', location, count: 2, stackCounts: [{ stack, count: 2 }] },
        ],
      }),
    )
    const [{ data, omittedEntryCount }] = await Chart.getData(directory)
    expect(data).toHaveLength(11)
    expect(data.reduce((total, item) => total + item.count, 0)).toBe(25)
    expect(omittedEntryCount).toBe(0)
    expect(data[0]).toMatchObject({ count: 14, delta: 14, label: `"<short hash>" at ${location}` })
    expect(data[0].title).toContain('Short hashes grouped; 4 distinct string values')
    for (const value of ['a2df', 'a2e0', 'Ab12Z9', 'event']) expect(data[0].title).toContain(JSON.stringify(value))
    expect(data.filter((item) => item.label.endsWith(' at unknown location'))).toHaveLength(2)
    expect(data.find((item) => item.name.startsWith('Stack: '))?.title).toContain(
      '0 complete stack string objects; 2 component string objects',
    )
    expect(new Set(data.map((item) => item.comparisonKey)).size).toBe(data.length)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('does not trust invalid stack partitions or collapse old files by substring matching', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'strings-with-locations-old-stacks-'))
  const stack = 'Error\n    at owner (file:///owner.js:1:1)'
  try {
    await mkdir(join(directory, 'strings-with-locations'))
    await writeFile(
      join(directory, 'strings-with-locations', 'output.json'),
      JSON.stringify({
        stringsWithLocations: [
          { string: stack, location: null, count: 1 },
          { string: 'fragment', location: null, count: 1, stackCounts: [{ stack, count: 2 }] },
          { string: 'another', location: null, count: 1, stackCounts: [{ stack, count: -1 }] },
        ],
      }),
    )
    const [{ data }] = await Chart.getData(directory)
    expect(data).toHaveLength(3)
    expect(data.reduce((total, item) => total + item.count, 0)).toBe(3)
    expect(data.every((item) => !item.name.startsWith('Stack: '))).toBe(true)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('omits exact numeric noise while preserving other numeric strings and stack components', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'strings-with-locations-noise-'))
  const stack = 'Error\n    at owner (file:///owner.js:1:1)'
  try {
    await mkdir(join(directory, 'strings-with-locations'))
    await writeFile(
      join(directory, 'strings-with-locations', 'output.json'),
      JSON.stringify({
        stringsWithLocations: [
          { string: 'NaN', location: null, count: 54 },
          { string: '0', location: 'owner.ts:1:1', count: 14 },
          { string: '4294967040', location: null, count: 6 },
          { string: 'Infinity', location: null, count: 4 },
          { string: '-Infinity', location: 'owner.ts:1:1', count: 3 },
          { string: 'Infinity value', location: null, count: 1 },
          { string: '4294967041', location: null, count: 5 },
          { string: '0px', location: null, count: 2 },
          { string: 'NaN value', location: null, count: 1 },
          { string: '0', location: null, count: 3, stackCounts: [{ stack, count: 2 }] },
        ],
      }),
    )
    const [{ data, omittedEntryCount }] = await Chart.getData(directory)
    expect(omittedEntryCount).toBe(6)
    expect(data.map((item) => item.count)).toEqual([5, 2, 2, 1, 1])
    for (const value of ['NaN', '0', '4294967040', 'Infinity', '-Infinity']) {
      expect(data.some((item) => item.label.startsWith(`"${value}" at `))).toBe(false)
    }
    expect(data.some((item) => item.label.startsWith('"Infinity value" at '))).toBe(true)
    expect(data.some((item) => item.label.startsWith('"4294967041" at '))).toBe(true)
    expect(data.some((item) => item.label.startsWith('"0px" at '))).toBe(true)
    expect(data.some((item) => item.label.startsWith('"NaN value" at '))).toBe(true)
    expect(data.find((item) => item.name.startsWith('Stack: '))?.title).toContain(
      '0 complete stack string objects; 2 component string objects',
    )
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('omits serialization markers and variable diagnostic messages while preserving stack components', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'strings-with-locations-diagnostics-'))
  const excluded = [
    'BigInt',
    '[BigInt ',
    '[BigInt 42]',
    'Circular',
    '[Circular]',
    'Renderer reported VERY LONG TASK',
    '[perf] Renderer reported VERY LONG TASK (123ms)',
    'perf] SLOW task detected',
    '[perf] SLOW task detected (42ms)',
  ]
  const retained = ['BigInteger', 'Circular reference', 'Renderer reported LONG TASK', '[perf] SLOW operation']
  const stack = 'Error\n    at owner (file:///owner.js:1:1)'
  try {
    await mkdir(join(directory, 'strings-with-locations'))
    await writeFile(
      join(directory, 'strings-with-locations', 'output.json'),
      JSON.stringify({
        stringsWithLocations: [
          ...excluded.map((string) => ({ string, location: 'src/owner.ts:1:1', count: 2 })),
          ...retained.map((string) => ({ string, location: null, count: 1 })),
          { string: '[Circular]', location: null, count: 3, stackCounts: [{ stack, count: 2 }] },
        ],
      }),
    )
    const [{ data, omittedEntryCount }] = await Chart.getData(directory)
    expect(omittedEntryCount).toBe(10)
    expect(data).toHaveLength(5)
    expect(data.reduce((sum, item) => sum + item.count, 0)).toBe(6)
    for (const value of retained) expect(data.some((item) => item.label.startsWith(`${JSON.stringify(value)} at `))).toBe(true)
    expect(data.find((item) => item.name.startsWith('Stack: '))?.title).toContain(
      '0 complete stack string objects; 2 component string objects',
    )
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('explains a capture containing only omitted strings', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'strings-with-locations-only-noise-'))
  try {
    await mkdir(join(directory, 'strings-with-locations'))
    await writeFile(
      join(directory, 'strings-with-locations', 'output.json'),
      JSON.stringify({
        stringsWithLocations: [
          { string: '0', location: null, count: 1 },
          { string: 'NaN', location: null, count: 1 },
          { string: '4294967040', location: null, count: 1 },
          { string: 'Infinity', location: null, count: 1 },
          { string: '-Infinity', location: null, count: 1 },
          { string: '[BigInt ', location: null, count: 1 },
          { string: '[Circular]', location: null, count: 1 },
          { string: '[perf] Renderer reported VERY LONG TASK (', location: null, count: 1 },
          { string: '[perf] SLOW task detected (', location: null, count: 1 },
        ],
      }),
    )
    const [result] = await Chart.getData(directory)
    expect(result.data).toEqual([])
    expect(result.omittedEntryCount).toBe(9)
    expect(result.status).toBe('Only excluded strings grew; omitted from chart.')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
