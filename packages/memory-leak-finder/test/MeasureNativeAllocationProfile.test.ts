import { expect, test } from '@jest/globals'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as MeasureNativeAllocationProfile from '../src/parts/MeasureNativeAllocationProfile/MeasureNativeAllocationProfile.ts'
import * as TargetId from '../src/parts/TargetId/TargetId.ts'

test('native allocation profile measure samples the action and cleans up normally', async () => {
  const calls: unknown[] = []
  const profile = {
    modules: [
      {
        baseAddress: '0x1000',
        name: 'electron',
        size: 1024,
        uuid: 'electron-uuid',
      },
    ],
    samples: [
      {
        size: 32,
        stack: ['malloc', 'render'],
        total: 320,
      },
    ],
  }
  const session = {
    dispose() {},
    invoke(method: string, params: unknown) {
      calls.push([method, params])
      if (method === 'Memory.getSamplingProfile') {
        return Promise.resolve({
          result: {
            profile,
          },
        })
      }
      return Promise.resolve({ result: {} })
    },
  } as any

  const args = MeasureNativeAllocationProfile.create(session) as [any, any]
  const before = await MeasureNativeAllocationProfile.start(...args)
  const after = await MeasureNativeAllocationProfile.stop(...args)
  const result = MeasureNativeAllocationProfile.compare(before, after)
  await MeasureNativeAllocationProfile.releaseResources(...args)

  expect(result).toEqual({
    isLeak: false,
    metrics: {
      attributedAllocationBytes: 320,
      moduleCount: 1,
      sampleCount: 1,
      sampledBytes: 32,
    },
    modules: [
      {
        baseAddress: '0x1000',
        name: 'electron',
        size: 1024,
        uuid: 'electron-uuid',
      },
    ],
    raw: {
      after: profile,
      before: {
        modules: [],
        samples: [],
      },
    },
    supported: true,
    topStacks: [
      {
        attributedAllocationBytes: 320,
        sampledBytes: 32,
        stack: ['malloc', 'render'],
      },
    ],
    unsupportedReason: '',
  })
  expect(calls).toEqual([
    [
      'Memory.startSampling',
      {
        samplingInterval: 32 * 1024,
        suppressRandomness: false,
      },
    ],
    ['Memory.getSamplingProfile', {}],
    ['Memory.stopSampling', {}],
  ])
})

test('native allocation profile measure stops sampling when profile retrieval fails', async () => {
  const calls: unknown[] = []
  const session = {
    dispose() {},
    invoke(method: string, params: unknown) {
      calls.push([method, params])
      if (method === 'Memory.getSamplingProfile') {
        return Promise.resolve({
          error: {
            code: -32602,
            message: 'Invalid parameters',
          },
        })
      }
      return Promise.resolve({ result: {} })
    },
  } as any
  const args = MeasureNativeAllocationProfile.create(session) as [any, any]

  await MeasureNativeAllocationProfile.start(...args)
  await expect(MeasureNativeAllocationProfile.stop(...args)).rejects.toThrow('Invalid parameters')

  expect(calls.map((call: any) => call[0])).toEqual(['Memory.startSampling', 'Memory.getSamplingProfile', 'Memory.stopSampling'])
})

test('native allocation profile measure release stops an active sampler', async () => {
  const calls: unknown[] = []
  const session = {
    dispose() {},
    invoke(method: string, params: unknown) {
      calls.push([method, params])
      return Promise.resolve({ result: {} })
    },
  } as any
  const args = MeasureNativeAllocationProfile.create(session) as [any, any]

  await MeasureNativeAllocationProfile.start(...args)
  await MeasureNativeAllocationProfile.releaseResources(...args)
  await MeasureNativeAllocationProfile.releaseResources(...args)

  expect(calls.map((call: any) => call[0])).toEqual(['Memory.startSampling', 'Memory.stopSampling'])
})

test('native allocation profile measure reports unavailable when profile retrieval is unsupported', async () => {
  const calls: unknown[] = []
  const session = {
    dispose() {},
    invoke(method: string, params: unknown) {
      calls.push([method, params])
      if (method === 'Memory.getSamplingProfile') {
        return Promise.resolve({
          error: {
            code: -32601,
            message: `'Memory.getSamplingProfile' wasn't found`,
          },
        })
      }
      return Promise.resolve({ result: {} })
    },
  } as any
  const args = MeasureNativeAllocationProfile.create(session) as [any, any]

  const before = await MeasureNativeAllocationProfile.start(...args)
  const after = await MeasureNativeAllocationProfile.stop(...args)
  const result = MeasureNativeAllocationProfile.compare(before, after)

  expect(result.supported).toBe(false)
  expect(result.unsupportedReason).toContain(`'Memory.getSamplingProfile' wasn't found`)
  expect(calls.map((call: any) => call[0])).toEqual(['Memory.startSampling', 'Memory.getSamplingProfile', 'Memory.stopSampling'])
})

test('native allocation profile measure reports unsupported targets without swallowing other errors', async () => {
  const unsupportedSession = {
    dispose() {},
    invoke(method: string) {
      return Promise.resolve({
        error: {
          code: -32601,
          message: `'Memory.startSampling' wasn't found`,
        },
      })
    },
  } as any
  const unsupportedArgs = MeasureNativeAllocationProfile.create(unsupportedSession) as [any, any]

  const before = await MeasureNativeAllocationProfile.start(...unsupportedArgs)
  const after = await MeasureNativeAllocationProfile.stop(...unsupportedArgs)
  const result = MeasureNativeAllocationProfile.compare(before, after)

  expect(result).toMatchObject({
    isLeak: false,
    metrics: {
      attributedAllocationBytes: 0,
      moduleCount: 0,
      sampleCount: 0,
      sampledBytes: 0,
    },
    supported: false,
  })
  expect(result.unsupportedReason).toContain(`'Memory.startSampling' wasn't found`)

  const invalidSession = {
    dispose() {},
    invoke() {
      return Promise.resolve({
        error: {
          code: -32602,
          message: 'Invalid parameters',
        },
      })
    },
  } as any
  const invalidArgs = MeasureNativeAllocationProfile.create(invalidSession) as [any, any]

  await expect(MeasureNativeAllocationProfile.start(...invalidArgs)).rejects.toThrow('Invalid parameters')
})

test('native allocation profile measure is informational and renderer-only', () => {
  expect(MeasureNativeAllocationProfile.id).toBe('nativeAllocationProfile')
  expect(MeasureNativeAllocationProfile.targets).toEqual([TargetId.Browser])
  expect(MeasureNativeAllocationProfile.isLeak()).toBe(false)
})

test('native allocation profile summary includes metrics and stacks', () => {
  const result = MeasureNativeAllocationProfile.summary({
    metrics: {
      attributedAllocationBytes: 200,
      moduleCount: 1,
      sampleCount: 2,
      sampledBytes: 20,
    },
    supported: true,
    topStacks: [
      {
        attributedAllocationBytes: 200,
        sampledBytes: 20,
        stack: ['malloc', 'paint'],
      },
    ],
    unsupportedReason: '',
  } as any)

  expect(result).toContain('Native allocation profile:')
  expect(result).toContain('attributedAllocationBytes | 200')
  expect(result).toContain('200 | 20 | malloc <- paint')
})

test('native-allocation-profile resolves through measure lookup', () => {
  const MemoryLeakFinder = {
    Measures: {
      MeasureNativeAllocationProfile,
    },
  }

  const measure = GetMeasure.getMeasure(MemoryLeakFinder, 'native-allocation-profile')

  expect(measure.id).toBe('nativeAllocationProfile')
})
