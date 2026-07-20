import { beforeEach, expect, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetAllMocks()
})

jest.unstable_mockModule('../src/parts/CallgrindControl/CallgrindControl.ts', () => {
  return {
    start: jest.fn(),
    stop: jest.fn(),
  }
})

jest.unstable_mockModule('../src/parts/CollectCallgrindResults/CollectCallgrindResults.ts', () => {
  return {
    collectCallgrindResults: jest.fn(() => ({
      isLeak: false,
      processes: [],
      rawFilePaths: [],
      skippedFiles: [],
      summary: {
        instructionReferences: 0,
        processCount: 0,
      },
      totalInstructionReferences: 0,
    })),
  }
})

const CallgrindControl = await import('../src/parts/CallgrindControl/CallgrindControl.ts')
const CollectCallgrindResults = await import('../src/parts/CollectCallgrindResults/CollectCallgrindResults.ts')
const MeasureCallgrind = await import('../src/parts/MeasureCallgrind/MeasureCallgrind.ts')

test('measureCallgrind - create requires valid connection id', () => {
  expect(() => MeasureCallgrind.create({ connectionId: Number.NaN })).toThrow(new Error(`Invalid Callgrind connection id: NaN`))
})

test('measureCallgrind - start turns instrumentation on', async () => {
  const [config] = MeasureCallgrind.create({ connectionId: 12 })
  await MeasureCallgrind.start(config)
  expect(CallgrindControl.start).toHaveBeenCalledWith(config)
})

test('measureCallgrind - stop turns instrumentation off and dumps', async () => {
  const [config] = MeasureCallgrind.create({ connectionId: 12 })
  await MeasureCallgrind.stop(config)
  expect(CallgrindControl.stop).toHaveBeenCalledWith(config)
})

test('measureCallgrind - compare requires resultPath', async () => {
  const [config] = MeasureCallgrind.create({ connectionId: 12 })
  await expect(MeasureCallgrind.compare({ startedAt: 1 }, { stoppedAt: 2 }, {}, config)).rejects.toThrow(
    new Error(`Callgrind measure requires resultPath in compare context`),
  )
})

test('measureCallgrind - compare collects results', async () => {
  const [config] = MeasureCallgrind.create({ connectionId: 12 })
  await MeasureCallgrind.compare({ startedAt: 1 }, { stoppedAt: 2 }, { resultPath: '/tmp/result.json' }, config)
  expect(CollectCallgrindResults.collectCallgrindResults).toHaveBeenCalledWith(config, '/tmp/result.json')
})
