import { expect, jest, test } from '@jest/globals'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const mockGetMetadata = jest.fn<() => Promise<any>>()
const mockGetChunk = jest.fn<(_session: any, index: number) => Promise<readonly number[]>>()

jest.unstable_mockModule('../src/parts/GetTrackedEverything/GetTrackedEverything.ts', () => ({
  getTrackedEverythingChunk: mockGetChunk,
  getTrackedEverythingMetadata: mockGetMetadata,
}))

const MeasureTrackedEverything = await import('../src/parts/MeasureTrackedEverything/MeasureTrackedEverything.ts')
const CompareTrackedEverything = await import('../src/parts/CompareTrackedEverything/CompareTrackedEverything.ts')

test('tracked everything preserves startup data and writes chunks in order', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'tracked-everything-measure-'))
  const eventPath = join(directory, 'events.bin')
  const start = jest.fn<(_session: any) => Promise<void>>().mockResolvedValue()
  const stop = jest.fn<(_session: any) => Promise<void>>().mockResolvedValue()
  const state = {
    scriptHandler: { scriptMap: {}, start, stop },
    temporaryEventPath: eventPath,
  }
  const session = {} as any
  mockGetMetadata.mockResolvedValue({
    chunkCount: 2,
    durationMs: 12,
    eventCount: 3,
    sites: [{ id: 0, location: '7:1:2', type: 'Object' }],
    timeMarks: [{ elapsedMs: 0, eventIndex: 0 }],
  })
  mockGetChunk.mockImplementation(async (_session, index) => (index === 0 ? [4, 2] : [9]))

  await expect(MeasureTrackedEverything.start(session, state)).resolves.toEqual({})
  expect(mockGetMetadata).not.toHaveBeenCalled()
  const result = await MeasureTrackedEverything.stop(session, state)

  expect(start).toHaveBeenCalledWith(session)
  expect(stop).toHaveBeenCalledWith(session)
  expect(result.metadata.eventCount).toBe(3)
  const bytes = await readFile(eventPath)
  expect([bytes.readUInt32LE(0), bytes.readUInt32LE(4), bytes.readUInt32LE(8)]).toEqual([4, 2, 9])
  await rm(directory, { force: true, recursive: true })
})

test('tracked everything rejects empty instrumentation output', async () => {
  const stop = jest.fn<(_session: any) => Promise<void>>().mockResolvedValue()
  mockGetMetadata.mockResolvedValue({ chunkCount: 0, durationMs: 0, eventCount: 0, sites: [], timeMarks: [] })
  await expect(
    MeasureTrackedEverything.stop({} as any, {
      scriptHandler: { scriptMap: {}, start: jest.fn<(_session: any) => Promise<void>>().mockResolvedValue(), stop },
      temporaryEventPath: '/unused',
    }),
  ).rejects.toThrow('Tracked everything produced no data')
  expect(stop).toHaveBeenCalled()
})

test('tracked everything comparison publishes the binary sidecar and versioned metadata', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'tracked-everything-compare-'))
  const temporaryEventPath = join(directory, 'temporary.bin')
  const resultPath = join(directory, 'scenario.json')
  await writeFile(temporaryEventPath, Buffer.from([0, 0, 0, 0]))
  const result = await CompareTrackedEverything.compareTrackedEverything(
    {},
    {
      metadata: {
        chunkCount: 1,
        durationMs: 42,
        eventCount: 1,
        sites: [{ id: 0, location: '7:1:2', type: 'Object' }],
        timeMarks: [
          { elapsedMs: 0, eventIndex: 0 },
          { elapsedMs: 42, eventIndex: 1 },
        ],
      },
      scriptMap: {},
      temporaryEventPath,
    },
    { resultPath } as any,
  )
  expect(result).toEqual({
    durationMs: 42,
    eventCount: 1,
    eventFile: 'scenario.events.bin',
    schemaVersion: 1,
    sites: [
      {
        id: 0,
        location: '7:1:2',
        originalColumn: null,
        originalLine: null,
        originalLocation: null,
        originalSource: null,
        type: 'Object',
      },
    ],
    timeMarks: [
      { elapsedMs: 0, eventIndex: 0 },
      { elapsedMs: 42, eventIndex: 1 },
    ],
  })
  expect(await readFile(join(directory, result.eventFile))).toEqual(Buffer.from([0, 0, 0, 0]))
  await rm(directory, { force: true, recursive: true })
})
