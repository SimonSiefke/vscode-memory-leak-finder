import { expect, jest, test } from '@jest/globals'
import * as TestStage from '../src/parts/TestStage/TestStage.ts'

const createScenario = (mode: 'cold' | 'warm', calls: string[]) => {
  return {
    mode,
    timing: {
      async arm(_context: any, iteration: number) {
        calls.push(`arm:${iteration}`)
      },
      async read(_context: any, iteration: number) {
        calls.push(`read:${iteration}`)
        return {
          actionStartMs: 100,
          domReadyMs: 106,
          paintReadyMs: 120,
          work: {
            allocations: {
              allocation: 2,
            },
            functions: {
              function: 3,
            },
          },
        }
      },
    },
    async prepare(_context: any, iteration: number) {
      calls.push(`prepare:${iteration}`)
    },
    async action(_context: any, iteration: number) {
      calls.push(`action:${iteration}`)
    },
    async ready(_context: any, iteration: number) {
      calls.push(`ready:${iteration}`)
    },
    async validate(_context: any, iteration: number) {
      calls.push(`validate:${iteration}`)
    },
    async reset(_context: any, iteration: number) {
      calls.push(`reset:${iteration}`)
    },
  }
}

test('warm performance scenario excludes warmup and preparation from measured run', async () => {
  const calls: string[] = []
  const getCodeMarks = (jest.fn() as any).mockResolvedValueOnce([{ name: 'code/before', startTime: 1 }]).mockResolvedValueOnce([
    { name: 'code/before', startTime: 1 },
    { name: 'code/willSetInputToTextFileEditor', startTime: 2 },
    { name: 'code/didSetInputToTextFileEditor', startTime: 3 },
  ])
  const context = {
    Performance: {
      getCodeMarks,
    },
  }
  const module = {
    performanceScenario: createScenario('warm', calls),
  }

  await TestStage.setup(module, context)
  expect(calls).toEqual(['prepare:-1', 'arm:-1', 'action:-1', 'ready:-1', 'read:-1', 'validate:-1', 'reset:-1', 'prepare:0', 'arm:0'])

  const result = await TestStage.run(module, context)
  expect(calls.slice(9)).toEqual(['action:0', 'ready:0', 'read:0'])
  expect(result?.performanceScenario.mode).toBe('warm')
  expect(result?.performanceScenario).toMatchObject({
    clock: 'renderer',
    domReadyLatencyMs: 6,
    latencyMs: 6,
    paintedLatencyMs: 20,
    work: {
      allocations: {
        allocation: 2,
      },
      functions: {
        function: 3,
      },
    },
  })
  expect(result?.performanceScenario.codeMarks).toEqual([
    { name: 'code/willSetInputToTextFileEditor', startTime: 2 },
    { name: 'code/didSetInputToTextFileEditor', startTime: 3 },
  ])

  await TestStage.teardown(module, context)
  expect(calls.slice(-2)).toEqual(['validate:0', 'reset:0'])
})

test('cold performance scenario has no warmup', async () => {
  const calls: string[] = []
  const module = {
    performanceScenario: createScenario('cold', calls),
  }
  await TestStage.setup(module, {})
  expect(calls).toEqual(['prepare:0', 'arm:0'])
})

test('test-worker delay after renderer readiness does not affect renderer latency', async () => {
  const calls: string[] = []
  const module = {
    performanceScenario: {
      ...createScenario('cold', calls),
      async ready() {
        await new Promise((resolve) => setTimeout(resolve, 25))
      },
    },
  }
  await TestStage.setup(module, {})
  const result = await TestStage.run(module, {})
  expect(result?.performanceScenario.latencyMs).toBe(6)
  expect(result?.performanceScenario.workerLatencyMs).toBeGreaterThanOrEqual(20)
})

test('invalid performance scenario fails before measurement', async () => {
  await expect(
    TestStage.setup(
      {
        performanceScenario: {
          mode: 'warm',
        },
      },
      {},
    ),
  ).rejects.toThrow('performanceScenario.prepare must be a function')
})
